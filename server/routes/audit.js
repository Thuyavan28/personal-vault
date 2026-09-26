import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'node:url';
import { query, queryOne, queryAll } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { logAuditEvent } from '../utils/audit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

const router = express.Router();

// Get security audit logs
router.get('/logs', authenticateToken, async (req, res) => {
  try {
    const logs = await queryAll(`
      SELECT a.*, v.title as item_title, v.type as item_type
      FROM audit_logs a
      LEFT JOIN vault_items v ON a.item_id = v.id
      WHERE a.user_id = $1
      ORDER BY a.timestamp DESC
      LIMIT 100
    `, [req.user.id]);

    return res.json({ logs });
  } catch (err) {
    console.error('Audit logs error:', err);
    return res.status(500).json({ error: 'Failed to retrieve audit logs.' });
  }
});

// Delete account & wipe all encrypted data (GDPR / Data wipe)
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    const { pin } = req.body;

    if (!pin) {
      return res.status(400).json({ error: '4-digit PIN confirmation required to delete account.' });
    }

    const user = await queryOne('SELECT id, pin_hash FROM users WHERE id = $1', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.pin_hash && !bcrypt.compareSync(pin, user.pin_hash)) {
      return res.status(401).json({ error: 'Incorrect PIN confirmation.' });
    }

    // Find and delete all encrypted files on disk
    const items = await queryAll('SELECT file_path FROM vault_items WHERE user_id = $1', [req.user.id]);
    for (const item of items) {
      if (item.file_path) {
        const filePath = path.join(UPLOADS_DIR, item.file_path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    // Delete user (cascades to vault_items and audit_logs)
    await query('DELETE FROM users WHERE id = $1', [req.user.id]);

    return res.json({ message: 'Account and all encrypted records successfully erased.' });
  } catch (err) {
    console.error('Delete account error:', err);
    return res.status(500).json({ error: 'Failed to erase account.' });
  }
});

export default router;
