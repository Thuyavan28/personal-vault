import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initDatabase, startKeepAlive } from './db/database.js';

import authRoutes from './routes/auth.js';
import pinRoutes from './routes/pin.js';
import vaultRoutes from './routes/vault.js';
import auditRoutes from './routes/audit.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config(); // fallback

const app = express();
const PORT = process.env.PORT || 5000;

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/pin', pinRoutes);
app.use('/api/vault', vaultRoutes);
app.use('/api/audit', auditRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'SecureVault API', db: 'Neon PostgreSQL', timestamp: new Date().toISOString() });
});

// Lazy database initialization ensuring zero-delay connections in serverless environments (Vercel)
let isDbReady = false;
let dbInitPromise = null;

export async function ensureDatabase() {
  if (isDbReady) return;
  if (!dbInitPromise) {
    dbInitPromise = (async () => {
      await initDatabase();
      startKeepAlive();
      isDbReady = true;
      console.log('[SecureVault] Neon PostgreSQL connected successfully.');
    })();
  }
  return dbInitPromise;
}

// Ensure database is ready before executing routes
app.use(async (req, res, next) => {
  if (req.path === '/api/health') return next();
  try {
    await ensureDatabase();
    next();
  } catch (err) {
    console.error('[SecureVault] Database connection failed:', err);
    res.status(500).json({ error: 'Database connection failed.' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error occurred.' });
});

// Start local listener if not in serverless environment
async function startServer() {
  try {
    await ensureDatabase();
    app.listen(PORT, () => {
      console.log(`[SecureVault] Backend listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('[SecureVault] Failed to connect to Neon DB:', err);
    process.exit(1);
  }
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
