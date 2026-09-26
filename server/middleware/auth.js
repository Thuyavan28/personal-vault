import jwt from 'jsonwebtoken';
import { queryOne } from '../db/database.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'SECURE_VAULT_JWT_SECRET_KEY_9921';

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }

  try {
    // Verify user still exists in DB
    const dbUser = await queryOne(
      'SELECT id, email, pin_hash, failed_pin_attempts, lockout_until FROM users WHERE id = $1',
      [decoded.id]
    );

    if (!dbUser) {
      return res.status(401).json({ error: 'User account no longer exists.' });
    }

    req.user = {
      id: dbUser.id,
      email: dbUser.email,
      hasPin: !!dbUser.pin_hash,
      failedPinAttempts: dbUser.failed_pin_attempts || 0,
      lockoutUntil: dbUser.lockout_until
    };

    next();
  } catch (err) {
    console.error('[Auth Middleware] DB error:', err.message);
    return res.status(500).json({ error: 'Internal server error validating user session.' });
  }
}
