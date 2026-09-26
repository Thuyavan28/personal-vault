import express from 'express';
import bcrypt from 'bcryptjs';
import { query, queryOne } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { logAuditEvent } from '../utils/audit.js';
import { invalidateUserCache } from './auth.js';

const router = express.Router();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 1000; // 30 seconds

/**
 * Check if the user is currently locked out
 */
async function checkLockout(user) {
  if (user.lockout_until) {
    const lockoutTime = new Date(user.lockout_until).getTime();
    const now = Date.now();
    if (now < lockoutTime) {
      const remainingSeconds = Math.ceil((lockoutTime - now) / 1000);
      return { isLocked: true, remainingSeconds };
    } else {
      // Lockout expired, reset attempts
      await query('UPDATE users SET failed_pin_attempts = 0, lockout_until = NULL WHERE id = $1', [user.id]);
    }
  }
  return { isLocked: false, remainingSeconds: 0 };
}

// Get PIN status & lockout state
router.get('/status', authenticateToken, async (req, res) => {
  const user = await queryOne(
    'SELECT id, pin_hash, failed_pin_attempts, lockout_until FROM users WHERE id = $1',
    [req.user.id]
  );
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const { isLocked, remainingSeconds } = await checkLockout(user);

  return res.json({
    hasPin: !!user.pin_hash,
    isLocked,
    remainingSeconds,
    failedAttempts: user.failed_pin_attempts || 0,
    maxAttempts: MAX_FAILED_ATTEMPTS
  });
});

// Create 4-digit PIN (First time setup)
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const { pin, confirmPin } = req.body;

    if (!pin || typeof pin !== 'string' || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: 'PIN must be exactly 4 digits (0-9).' });
    }

    if (confirmPin && pin !== confirmPin) {
      return res.status(400).json({ error: 'PIN and confirmation do not match.' });
    }

    const salt = bcrypt.genSaltSync(8);
    const pinHash = bcrypt.hashSync(pin, salt);

    await query(
      `UPDATE users
       SET pin_hash = $1, failed_pin_attempts = 0, lockout_until = NULL
       WHERE id = $2`,
      [pinHash, req.user.id]
    );

    await logAuditEvent({
      userId: req.user.id,
      action: 'pin_created',
      status: 'success',
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    invalidateUserCache(req.user.id);

    return res.json({
      message: 'Security PIN created successfully.',
      hasPin: true
    });
  } catch (err) {
    console.error('Create PIN error:', err);
    return res.status(500).json({ error: 'Internal server error creating PIN.' });
  }
});

// Verify 4-digit PIN (with rate-limiting and 30s lockout after 5 attempts)
router.post('/verify', authenticateToken, async (req, res) => {
  try {
    const { pin } = req.body;

    if (!pin || typeof pin !== 'string' || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: 'PIN must be a 4-digit number.' });
    }

    const user = await queryOne(
      'SELECT id, pin_hash, failed_pin_attempts, lockout_until FROM users WHERE id = $1',
      [req.user.id]
    );

    if (!user || !user.pin_hash) {
      return res.status(400).json({ error: 'No security PIN set for this account.' });
    }

    // Check lockout
    const { isLocked, remainingSeconds } = await checkLockout(user);
    if (isLocked) {
      await logAuditEvent({
        userId: user.id,
        action: 'pin_verify_rejected_lockout',
        status: 'failed',
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
      });

      return res.status(429).json({
        error: `Too many failed attempts. Security lockout in effect. Please wait ${remainingSeconds}s.`,
        isLocked: true,
        remainingSeconds
      });
    }

    const isMatch = bcrypt.compareSync(pin, user.pin_hash);

    if (!isMatch) {
      const newAttempts = (user.failed_pin_attempts || 0) + 1;
      let lockoutUntil = null;
      let isNowLocked = false;
      let secondsLeft = 0;

      if (newAttempts >= MAX_FAILED_ATTEMPTS) {
        lockoutUntil = new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString();
        isNowLocked = true;
        secondsLeft = 30;

        await logAuditEvent({
          userId: user.id,
          action: 'lockout',
          status: 'failed',
          ip: req.ip || req.socket.remoteAddress,
          userAgent: req.headers['user-agent']
        });
      } else {
        await logAuditEvent({
          userId: user.id,
          action: 'pin_verify_failed',
          status: 'failed',
          ip: req.ip || req.socket.remoteAddress,
          userAgent: req.headers['user-agent']
        });
      }

      await query(
        `UPDATE users
         SET failed_pin_attempts = $1, lockout_until = $2
         WHERE id = $3`,
        [newAttempts, lockoutUntil, user.id]
      );

      const attemptsRemaining = Math.max(0, MAX_FAILED_ATTEMPTS - newAttempts);

      return res.status(401).json({
        error: isNowLocked
          ? `Incorrect PIN. Max attempts reached. Locked for 30s.`
          : `Incorrect PIN. ${attemptsRemaining} attempt${attemptsRemaining === 1 ? '' : 's'} remaining.`,
        isLocked: isNowLocked,
        remainingSeconds: secondsLeft,
        attemptsRemaining
      });
    }

    // Correct PIN: reset failed attempts
    await query('UPDATE users SET failed_pin_attempts = 0, lockout_until = NULL WHERE id = $1', [user.id]);

    await logAuditEvent({
      userId: user.id,
      action: 'pin_verify_success',
      status: 'success',
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    return res.json({
      message: 'PIN verified successfully.',
      verified: true
    });
  } catch (err) {
    console.error('Verify PIN error:', err);
    return res.status(500).json({ error: 'Internal server error verifying PIN.' });
  }
});

// Change PIN (Requires current PIN verification)
router.put('/change', authenticateToken, async (req, res) => {
  try {
    const { currentPin, newPin, confirmNewPin } = req.body;

    if (!currentPin || !newPin) {
      return res.status(400).json({ error: 'Current PIN and new PIN are required.' });
    }

    if (!/^\d{4}$/.test(newPin)) {
      return res.status(400).json({ error: 'New PIN must be exactly 4 digits (0-9).' });
    }

    if (confirmNewPin && newPin !== confirmNewPin) {
      return res.status(400).json({ error: 'New PIN and confirmation do not match.' });
    }

    const user = await queryOne('SELECT id, pin_hash FROM users WHERE id = $1', [req.user.id]);

    if (!user || !user.pin_hash) {
      return res.status(400).json({ error: 'No existing PIN found.' });
    }

    const isMatch = bcrypt.compareSync(currentPin, user.pin_hash);
    if (!isMatch) {
      await logAuditEvent({
        userId: user.id,
        action: 'pin_change_failed',
        status: 'failed',
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent']
      });
      return res.status(401).json({ error: 'Current PIN is incorrect.' });
    }

    const salt = bcrypt.genSaltSync(8);
    const newPinHash = bcrypt.hashSync(newPin, salt);

    await query(
      `UPDATE users
       SET pin_hash = $1, failed_pin_attempts = 0, lockout_until = NULL
       WHERE id = $2`,
      [newPinHash, user.id]
    );

    await logAuditEvent({
      userId: user.id,
      action: 'pin_changed',
      status: 'success',
      ip: req.ip || req.socket.remoteAddress,
      userAgent: req.headers['user-agent']
    });

    invalidateUserCache(user.id);

    return res.json({
      message: 'Security PIN updated successfully.'
    });
  } catch (err) {
    console.error('Change PIN error:', err);
    return res.status(500).json({ error: 'Internal server error changing PIN.' });
  }
});

export default router;
