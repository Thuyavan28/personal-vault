import crypto from 'node:crypto';
import { query } from '../db/database.js';

/**
 * Log an audit event asynchronously without blocking the HTTP request
 * @param {Object} params
 * @param {string} params.userId
 * @param {string} [params.itemId]
 * @param {string} params.action
 * @param {'success'|'failed'} params.status
 * @param {string} [params.ip]
 * @param {string} [params.userAgent]
 */
export async function logAuditEvent({ userId, itemId = null, action, status, ip = '127.0.0.1', userAgent = 'Unknown Device' }) {
  const id = 'log_' + crypto.randomUUID();
  const timestamp = new Date().toISOString();

  // Run in background so client receives response immediately
  query(
    `INSERT INTO audit_logs (id, user_id, item_id, action, status, ip_address, user_agent, timestamp)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [id, userId, itemId, action, status, ip, userAgent, timestamp]
  ).catch(err => {
    console.error('[Audit] Async write error:', err.message);
  });

  return id;
}
