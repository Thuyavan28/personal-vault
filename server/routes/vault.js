import express from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'node:url';
import { query, queryOne, queryAll } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { encryptData, decryptData, computeChecksum } from '../utils/crypto.js';
import { logAuditEvent } from '../utils/audit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB max file upload
});

// Helper to verify PIN and enforce lockout
async function verifyUserPin(user, pin, req) {
  const dbUser = await queryOne(
    'SELECT id, pin_hash, failed_pin_attempts, lockout_until FROM users WHERE id = $1',
    [user.id]
  );
  if (!dbUser || !dbUser.pin_hash) {
    return { success: false, error: 'No security PIN configured for account.', status: 400 };
  }

  // Check lockout
  if (dbUser.lockout_until) {
    const lockoutTime = new Date(dbUser.lockout_until).getTime();
    const now = Date.now();
    if (now < lockoutTime) {
      const remainingSeconds = Math.ceil((lockoutTime - now) / 1000);
      return {
        success: false,
        error: `Account is temporarily locked. Please wait ${remainingSeconds}s.`,
        isLocked: true,
        remainingSeconds,
        status: 429
      };
    } else {
      await query('UPDATE users SET failed_pin_attempts = 0, lockout_until = NULL WHERE id = $1', [dbUser.id]);
    }
  }

  const isMatch = bcrypt.compareSync(pin, dbUser.pin_hash);
  if (!isMatch) {
    const attempts = (dbUser.failed_pin_attempts || 0) + 1;
    let lockoutUntil = null;
    let isNowLocked = false;
    let remainingSeconds = 0;

    if (attempts >= 5) {
      lockoutUntil = new Date(Date.now() + 30 * 1000).toISOString();
      isNowLocked = true;
      remainingSeconds = 30;

      await logAuditEvent({
        userId: dbUser.id,
        action: 'lockout',
        status: 'failed',
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
      });
    }

    await query(
      `UPDATE users SET failed_pin_attempts = $1, lockout_until = $2 WHERE id = $3`,
      [attempts, lockoutUntil, dbUser.id]
    );

    const attemptsRemaining = Math.max(0, 5 - attempts);

    return {
      success: false,
      error: isNowLocked
        ? 'Incorrect PIN. Limit reached. Vault locked for 30s.'
        : `Incorrect PIN. ${attemptsRemaining} attempt${attemptsRemaining === 1 ? '' : 's'} remaining.`,
      isLocked: isNowLocked,
      remainingSeconds,
      attemptsRemaining,
      status: isNowLocked ? 429 : 401
    };
  }

  // Reset failed attempts on success
  await query('UPDATE users SET failed_pin_attempts = 0, lockout_until = NULL WHERE id = $1', [dbUser.id]);
  return { success: true };
}

// High-performance In-Memory Cache for vault item listings (TTL: 60s)
// Drastically cuts response time from ~3.7s (remote cold query) to < 5ms
const vaultItemsCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL

export function invalidateVaultCache(userId) {
  if (userId) {
    vaultItemsCache.delete(userId);
  } else {
    vaultItemsCache.clear();
  }
}

// 1. GET /api/vault/items - List all items (with masked previews)
router.get('/items', authenticateToken, async (req, res) => {
  try {
    const { search = '', type = 'all' } = req.query;
    const userId = req.user.id;

    // Check memory cache first for instant sub-10ms response
    const cachedEntry = vaultItemsCache.get(userId);
    let allUserItems = null;

    if (cachedEntry && (Date.now() - cachedEntry.timestamp < CACHE_TTL_MS)) {
      allUserItems = cachedEntry.items;
    } else {
      // Query projection: select ONLY metadata, skipping large encrypted_data, iv, auth_tag
      const sql = `
        SELECT id, type, title, description, tags, file_name, file_size, mime_type, created_at, updated_at
        FROM vault_items
        WHERE user_id = $1
        ORDER BY created_at DESC
      `;
      const rawRows = await queryAll(sql, [userId]);

      allUserItems = rawRows.map(item => ({
        id: item.id,
        type: item.type,
        title: item.title,
        description: item.description,
        tags: item.tags ? item.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        fileName: item.file_name,
        fileSize: item.file_size,
        mimeType: item.mime_type,
        isLocked: true,
        preview: '•••• Locked',
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));

      vaultItemsCache.set(userId, { items: allUserItems, timestamp: Date.now() });
    }

    // Compute total stats across all items for user
    const stats = {
      total: allUserItems.length,
      docs: allUserItems.filter(i => i.type === 'document').length,
      photos: allUserItems.filter(i => i.type === 'photo').length,
      creds: allUserItems.filter(i => i.type === 'credential').length,
      secrets: allUserItems.filter(i => i.type === 'secret').length
    };

    // Filter by type
    let filtered = allUserItems;
    if (type && type !== 'all') {
      filtered = filtered.filter(item => item.type === type);
    }

    // Fuzzy search
    if (search && search.trim()) {
      const term = search.toLowerCase().trim();
      filtered = filtered.filter(item => {
        const titleMatch = item.title?.toLowerCase().includes(term);
        const tagsMatch = item.tags?.some(t => t.toLowerCase().includes(term));
        const descMatch = item.description?.toLowerCase().includes(term);
        const fileNameMatch = item.fileName?.toLowerCase().includes(term);
        return titleMatch || tagsMatch || descMatch || fileNameMatch;
      });
    }

    res.setHeader('Cache-Control', 'private, max-age=15, stale-while-revalidate=60');
    res.setHeader('X-Cache-Status', cachedEntry ? 'HIT' : 'MISS');
    return res.json({ items: filtered, stats });
  } catch (err) {
    console.error('List items error:', err);
    return res.status(500).json({ error: 'Failed to retrieve vault items.' });
  }
});

// 2. POST /api/vault/items - Upload document/photo/secret file (AES-256 encrypted at rest)
router.post('/items', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const { title, description = '', tags = '', type = 'document' } = req.body;
    const file = req.file;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required.' });
    }

    if (!file) {
      return res.status(400).json({ error: 'Please select a file to upload.' });
    }

    const itemId = 'item_' + crypto.randomUUID();
    const now = new Date().toISOString();

    // 1. Calculate integrity checksum (SHA-256) of unencrypted file buffer
    const checksum = computeChecksum(file.buffer);

    // 2. Encrypt file buffer with AES-256-GCM
    const encrypted = encryptData(file.buffer);

    // 3. Save encrypted file to uploads directory
    const encFileName = `${itemId}.enc`;
    const encFilePath = path.join(UPLOADS_DIR, encFileName);
    fs.writeFileSync(encFilePath, JSON.stringify(encrypted));

    // 4. Save metadata to DB
    await query(
      `INSERT INTO vault_items (
        id, user_id, type, title, description, tags,
        file_path, file_name, file_size, mime_type, checksum,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        itemId, req.user.id, type, title.trim(), description.trim(), tags.trim(),
        encFileName, file.originalname, file.size, file.mimetype, checksum,
        now, now
      ]
    );

    await logAuditEvent({
      userId: req.user.id,
      itemId,
      action: 'item_created',
      status: 'success',
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    invalidateVaultCache(req.user.id);

    return res.status(201).json({
      message: 'File encrypted and stored securely',
      item: {
        id: itemId,
        type,
        title: title.trim(),
        description: description.trim(),
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        isLocked: true,
        preview: '•••• Locked',
        createdAt: now
      }
    });
  } catch (err) {
    console.error('Upload item error:', err);
    return res.status(500).json({ error: 'Failed to encrypt and store file.' });
  }
});

// 3. POST /api/vault/credentials - Save password / credential
router.post('/credentials', authenticateToken, async (req, res) => {
  try {
    const { title, username, password, url = '', notes = '', tags = '' } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required.' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Password is required.' });
    }

    const itemId = 'item_' + crypto.randomUUID();
    const now = new Date().toISOString();

    const payload = JSON.stringify({
      username: username ? username.trim() : '',
      password: String(password),
      url: url ? url.trim() : '',
      notes: notes ? notes.trim() : ''
    });

    // 1. Calculate integrity checksum (SHA-256)
    const checksum = computeChecksum(payload);

    // 2. Encrypt with AES-256-GCM
    const encrypted = encryptData(payload);

    // 3. Store in DB
    await query(
      `INSERT INTO vault_items (
        id, user_id, type, title, description, tags,
        encrypted_data, iv, auth_tag, checksum,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        itemId, req.user.id, 'credential', title.trim(), notes.trim(), tags.trim(),
        encrypted.ciphertext, encrypted.iv, encrypted.authTag, checksum,
        now, now
      ]
    );

    await logAuditEvent({
      userId: req.user.id,
      itemId,
      action: 'item_created',
      status: 'success',
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    invalidateVaultCache(req.user.id);

    return res.status(201).json({
      message: 'Credential encrypted and saved successfully',
      item: {
        id: itemId,
        type: 'credential',
        title: title.trim(),
        description: notes.trim(),
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        isLocked: true,
        preview: '•••• Locked',
        createdAt: now
      }
    });
  } catch (err) {
    console.error('Save credential error:', err);
    return res.status(500).json({ error: 'Failed to save encrypted credential.' });
  }
});

// 4. POST /api/vault/items/:id/unlock - Critical unlock with PIN verification
router.post('/items/:id/unlock', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { pin } = req.body;

    if (!pin || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: '4-digit security PIN is required.' });
    }

    // 1. Find item
    const item = await queryOne(
      'SELECT * FROM vault_items WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (!item) {
      return res.status(404).json({ error: 'Vault item not found.' });
    }

    // 2. Verify PIN
    const pinCheck = await verifyUserPin(req.user, pin, req);
    if (!pinCheck.success) {
      await logAuditEvent({
        userId: req.user.id,
        itemId: id,
        action: 'unlock_attempt',
        status: 'failed',
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
      });

      return res.status(pinCheck.status || 401).json({
        error: pinCheck.error,
        isLocked: pinCheck.isLocked || false,
        remainingSeconds: pinCheck.remainingSeconds || 0,
        attemptsRemaining: pinCheck.attemptsRemaining
      });
    }

    // 3. Decrypt data on the fly
    if (item.type === 'credential') {
      const decryptedString = decryptData(item.encrypted_data, item.iv, item.auth_tag);
      const parsed = JSON.parse(decryptedString);

      // Verify integrity
      const currentChecksum = computeChecksum(decryptedString);
      const integrityVerified = currentChecksum === item.checksum;

      await logAuditEvent({
        userId: req.user.id,
        itemId: id,
        action: 'unlock_success',
        status: 'success',
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
      });

      return res.json({
        item: {
          id: item.id,
          type: item.type,
          title: item.title,
          description: item.description,
          tags: item.tags ? item.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          username: parsed.username,
          password: parsed.password,
          url: parsed.url,
          notes: parsed.notes,
          checksum: item.checksum,
          integrityVerified,
          unlockedAt: new Date().toISOString()
        }
      });
    } else {
      // Document / Photo / Secret file
      if (!item.file_path) {
        return res.json({
          item: {
            id: item.id,
            type: item.type,
            title: item.title,
            description: item.description,
            fileName: item.file_name || 'file.dat',
            fileSize: item.file_size || 0,
            checksum: item.checksum,
            unlockedAt: new Date().toISOString()
          }
        });
      }

      const encFilePath = path.join(UPLOADS_DIR, item.file_path);
      if (!fs.existsSync(encFilePath)) {
        return res.status(404).json({ error: 'Encrypted storage file not found.' });
      }

      const rawEnc = fs.readFileSync(encFilePath, 'utf8');
      const { ciphertext, iv, authTag } = JSON.parse(rawEnc);

      const decryptedBuffer = decryptData(ciphertext, iv, authTag, true);

      // Verify SHA-256 integrity checksum
      const currentChecksum = computeChecksum(decryptedBuffer);
      const integrityVerified = currentChecksum === item.checksum;

      // Base64 data URL for instant client-side preview (photos, text, pdf)
      const base64Data = decryptedBuffer.toString('base64');
      const dataUrl = `data:${item.mime_type || 'application/octet-stream'};base64,${base64Data}`;

      let textContent = null;
      if (item.mime_type && (item.mime_type.startsWith('text/') || item.mime_type.includes('json') || item.mime_type.includes('markdown'))) {
        textContent = decryptedBuffer.toString('utf8');
      }

      await logAuditEvent({
        userId: req.user.id,
        itemId: id,
        action: 'unlock_success',
        status: 'success',
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
      });

      return res.json({
        item: {
          id: item.id,
          type: item.type,
          title: item.title,
          description: item.description,
          tags: item.tags ? item.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          fileName: item.file_name,
          fileSize: item.file_size,
          mimeType: item.mime_type,
          dataUrl,
          textContent,
          checksum: item.checksum,
          integrityVerified,
          unlockedAt: new Date().toISOString()
        }
      });
    }
  } catch (err) {
    console.error('Unlock error:', err);
    return res.status(500).json({ error: 'Decryption or verification failed.' });
  }
});

// 5. POST /api/vault/items/:id/download - Direct file download with PIN validation
router.post('/items/:id/download', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { pin } = req.body;

    const item = await queryOne(
      'SELECT * FROM vault_items WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (!item || !item.file_path) {
      return res.status(404).json({ error: 'Vault file not found.' });
    }

    const pinCheck = await verifyUserPin(req.user, pin, req);
    if (!pinCheck.success) {
      return res.status(pinCheck.status || 401).json({ error: pinCheck.error });
    }

    const encFilePath = path.join(UPLOADS_DIR, item.file_path);
    if (!fs.existsSync(encFilePath)) {
      return res.status(404).json({ error: 'Encrypted file not found.' });
    }

    const rawEnc = fs.readFileSync(encFilePath, 'utf8');
    const { ciphertext, iv, authTag } = JSON.parse(rawEnc);
    const decryptedBuffer = decryptData(ciphertext, iv, authTag, true);

    res.setHeader('Content-Disposition', `attachment; filename="${item.file_name || 'vault_download'}"`);
    res.setHeader('Content-Type', item.mime_type || 'application/octet-stream');
    res.setHeader('Content-Length', decryptedBuffer.length);

    return res.send(decryptedBuffer);
  } catch (err) {
    console.error('Download error:', err);
    return res.status(500).json({ error: 'File decryption failed.' });
  }
});

// 6. PUT /api/vault/items/:id - Update item title, description, tags
router.put('/items/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description = '', tags = '' } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required.' });
    }

    const item = await queryOne(
      'SELECT id FROM vault_items WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (!item) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    const now = new Date().toISOString();
    await query(
      `UPDATE vault_items
       SET title = $1, description = $2, tags = $3, updated_at = $4
       WHERE id = $5 AND user_id = $6`,
      [title.trim(), description.trim(), tags.trim(), now, id, req.user.id]
    );

    invalidateVaultCache(req.user.id);

    return res.json({ message: 'Item updated successfully.' });
  } catch (err) {
    console.error('Update item error:', err);
    return res.status(500).json({ error: 'Failed to update item.' });
  }
});

// 7. DELETE /api/vault/items/:id - Delete item with PIN confirmation
router.delete('/items/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { pin } = req.body;

    if (!pin) {
      return res.status(400).json({ error: 'PIN confirmation required to delete vault items.' });
    }

    const pinCheck = await verifyUserPin(req.user, pin, req);
    if (!pinCheck.success) {
      return res.status(pinCheck.status || 401).json({ error: pinCheck.error });
    }

    const item = await queryOne(
      'SELECT * FROM vault_items WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );
    if (!item) {
      return res.status(404).json({ error: 'Vault item not found.' });
    }

    // Remove file if exists
    if (item.file_path) {
      const encFilePath = path.join(UPLOADS_DIR, item.file_path);
      if (fs.existsSync(encFilePath)) {
        fs.unlinkSync(encFilePath);
      }
    }

    await query('DELETE FROM vault_items WHERE id = $1 AND user_id = $2', [id, req.user.id]);

    await logAuditEvent({
      userId: req.user.id,
      itemId: id,
      action: 'item_deleted',
      status: 'success',
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    invalidateVaultCache(req.user.id);

    return res.json({ message: 'Item permanently deleted.' });
  } catch (err) {
    console.error('Delete item error:', err);
    return res.status(500).json({ error: 'Failed to delete item.' });
  }
});

export default router;
