import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { encryptData, computeChecksum } from '../utils/crypto.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
dotenv.config(); // fallback

const { Pool } = pg;

// Neon PostgreSQL connection pool — optimized for high speed and minimal connection churn
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20, // increased pool size for concurrent queries
  idleTimeoutMillis: 300000, // 5 min idle pool retention (prevents cold re-connections)
  connectionTimeoutMillis: 10000, // 10s connection acquisition timeout
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
});

// Periodic keepalive to keep Neon compute active and eliminate 2.5s cold starts
let keepAliveTimer = null;
export function startKeepAlive() {
  if (keepAliveTimer) return;
  // Immediate pre-warm
  pool.query('SELECT 1').catch(() => {});

  // Frequent 45s keepalive keeps serverless Neon instance warm at all times
  keepAliveTimer = setInterval(async () => {
    try {
      await pool.query('SELECT 1');
    } catch {
      // Ignore background keepalive failures
    }
  }, 45 * 1000); // every 45 seconds
}

pool.on('error', (err) => {
  console.warn('[DB] Pool client disconnected or reset:', err.message);
});

// Helper for resilient query execution with auto-retry
async function executeWithRetry(queryFn) {
  try {
    return await queryFn();
  } catch (err) {
    const isConnErr =
      err.message?.includes('Connection') ||
      err.message?.includes('timeout') ||
      err.message?.includes('terminated') ||
      err.message?.includes('closed') ||
      err.message?.includes('ECONNRESET');

    if (isConnErr) {
      console.warn('[DB] Transient connection error, retrying query...', err.message);
      return await queryFn();
    }
    throw err;
  }
}

// Fast query — uses pool.query() with auto-retry
export async function query(text, params) {
  return executeWithRetry(() => pool.query(text, params));
}

// Get single row with auto-retry
export async function queryOne(text, params) {
  const result = await executeWithRetry(() => pool.query(text, params));
  return result.rows[0] || null;
}

// Get all rows with auto-retry
export async function queryAll(text, params) {
  const result = await executeWithRetry(() => pool.query(text, params));
  return result.rows;
}

// Initialize database tables & seed demo user
export async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        pin_hash TEXT,
        google_id TEXT,
        name TEXT,
        avatar_url TEXT,
        phone TEXT,
        bio TEXT,
        failed_pin_attempts INTEGER DEFAULT 0,
        lockout_until TEXT,
        profile_completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS vault_items (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        tags TEXT,
        encrypted_data TEXT,
        iv TEXT,
        auth_tag TEXT,
        file_path TEXT,
        file_name TEXT,
        file_size INTEGER,
        mime_type TEXT,
        checksum TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        item_id TEXT,
        action TEXT NOT NULL,
        status TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Safe column migrations
    const cols = [
      { col: 'google_id', type: 'TEXT' },
      { col: 'name', type: 'TEXT' },
      { col: 'avatar_url', type: 'TEXT' },
      { col: 'phone', type: 'TEXT' },
      { col: 'bio', type: 'TEXT' },
      { col: 'profile_completed', type: 'BOOLEAN DEFAULT FALSE' }
    ];
    for (const c of cols) {
      try { await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${c.col} ${c.type};`); } catch (_) {}
    }

    // Indexes (including composite index for ultra-fast vault listing)
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_vault_items_user_id ON vault_items(user_id);
      CREATE INDEX IF NOT EXISTS idx_vault_items_type ON vault_items(type);
      CREATE INDEX IF NOT EXISTS idx_vault_items_user_created ON vault_items(user_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);

    // Seed demo user if not present
    const existingDemo = await pool.query('SELECT id FROM users WHERE email = $1', ['demo@securevault.io']);
    if (existingDemo.rows.length === 0) {
      const demoId = 'user_demo_default';
      const salt = bcrypt.genSaltSync(8);
      const passHash = bcrypt.hashSync('Password123!', salt);
      const pinHash = bcrypt.hashSync('1234', salt);
      await pool.query(
        `INSERT INTO users (id, email, password_hash, pin_hash, name, profile_completed, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [demoId, 'demo@securevault.io', passHash, pinHash, 'Demo Account', true]
      );

      // Seed 3 items for demo user
      const rawPayload = JSON.stringify({
        title: 'Work Email Login',
        username: 'alex.doe@company.corp',
        password: 'UltraSecureP@ssword2025!',
        url: 'https://mail.company.corp',
        notes: '2FA Backup: 8849-2011'
      });
      const { ciphertext, iv, authTag } = encryptData(rawPayload);
      const checksum = computeChecksum(rawPayload);

      await pool.query(
        `INSERT INTO vault_items (id, user_id, type, title, description, tags, encrypted_data, iv, auth_tag, checksum, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
        ['item_demo_1', demoId, 'credential', 'Work Email Login', 'Corporate email credentials', 'work,email', ciphertext, iv, authTag, checksum]
      );

      await pool.query(
        `INSERT INTO vault_items (id, user_id, type, title, description, tags, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
        ['item_demo_2', demoId, 'document', 'Annual Tax Return 2024', 'Tax return statement PDF', 'tax,finance']
      );

      await pool.query(
        `INSERT INTO vault_items (id, user_id, type, title, description, tags, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
        ['item_demo_3', demoId, 'photo', 'Passport Scan Copy', 'Government issued ID scan', 'id,passport']
      );

      console.log('[DB] Seeded demo user demo@securevault.io');
    } else {
      const demoId = existingDemo.rows[0].id;
      // Ensure all demo item categories exist
      const existingItems = await pool.query('SELECT type FROM vault_items WHERE user_id = $1', [demoId]);
      const existingTypes = new Set(existingItems.rows.map(r => r.type));

      if (!existingTypes.has('credential')) {
        const rawPayload = JSON.stringify({
          title: 'Work Email Login',
          username: 'alex.doe@company.corp',
          password: 'UltraSecureP@ssword2025!',
          url: 'https://mail.company.corp',
          notes: '2FA Backup: 8849-2011'
        });
        const { ciphertext, iv, authTag } = encryptData(rawPayload);
        const checksum = computeChecksum(rawPayload);
        await pool.query(
          `INSERT INTO vault_items (id, user_id, type, title, description, tags, encrypted_data, iv, auth_tag, checksum, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())`,
          ['item_demo_1', demoId, 'credential', 'Work Email Login', 'Corporate email credentials', 'work,email', ciphertext, iv, authTag, checksum]
        );
      }

      if (!existingTypes.has('document')) {
        await pool.query(
          `INSERT INTO vault_items (id, user_id, type, title, description, tags, file_name, file_size, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
          ['item_demo_2', demoId, 'document', 'Annual Tax Return 2024', 'Tax return statement PDF', 'tax,finance', 'tax_statement_2024.pdf', 1048576]
        );
      }

      if (!existingTypes.has('photo')) {
        await pool.query(
          `INSERT INTO vault_items (id, user_id, type, title, description, tags, file_name, file_size, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
          ['item_demo_3', demoId, 'photo', 'Passport Scan Copy', 'Government issued ID scan', 'id,passport', 'passport_scan.jpg', 2097152]
        );
      }

      if (!existingTypes.has('secret')) {
        await pool.query(
          `INSERT INTO vault_items (id, user_id, type, title, description, tags, file_name, file_size, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
          ['item_demo_4', demoId, 'secret', 'Encrypted Master Backup', 'Hardware key recovery phrase', 'backup,security', 'recovery_keys.dat', 4096]
        );
      }
    }

    console.log('[DB] Neon PostgreSQL tables initialized successfully.');
  } catch (err) {
    console.error('[DB] Failed to initialize database:', err);
    throw err;
  }
}

export { pool };
