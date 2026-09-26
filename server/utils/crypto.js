import crypto from 'node:crypto';

// Master encryption key derived from environment or secure fallback
const MASTER_KEY_HEX = process.env.VAULT_MASTER_KEY || crypto.createHash('sha256').update('SECURE_VAULT_AES256_DEFAULT_KEY_2025').digest('hex');
const ALGORITHM = 'aes-256-gcm';

/**
 * Encrypt a string or buffer using AES-256-GCM
 * @param {string|Buffer} data
 * @returns {{ ciphertext: string, iv: string, authTag: string }}
 */
export function encryptData(data) {
  const key = Buffer.from(MASTER_KEY_HEX, 'hex');
  // 12-byte IV is standard and optimal for AES-GCM
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const inputBuffer = Buffer.isBuffer(data) ? data : Buffer.from(String(data), 'utf8');
  const encrypted = Buffer.concat([cipher.update(inputBuffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64')
  };
}

/**
 * Decrypt a base64 ciphertext using AES-256-GCM
 * @param {string} ciphertextBase64
 * @param {string} ivBase64
 * @param {string} authTagBase64
 * @param {boolean} asBuffer
 * @returns {string|Buffer}
 */
export function decryptData(ciphertextBase64, ivBase64, authTagBase64, asBuffer = false) {
  const key = Buffer.from(MASTER_KEY_HEX, 'hex');
  const iv = Buffer.from(ivBase64, 'base64');
  const authTag = Buffer.from(authTagBase64, 'base64');
  const encryptedBuffer = Buffer.from(ciphertextBase64, 'base64');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
  return asBuffer ? decrypted : decrypted.toString('utf8');
}

/**
 * Compute SHA-256 checksum for integrity verification
 * @param {string|Buffer} data
 * @returns {string} hex digest
 */
export function computeChecksum(data) {
  const inputBuffer = Buffer.isBuffer(data) ? data : Buffer.from(String(data), 'utf8');
  return crypto.createHash('sha256').update(inputBuffer).digest('hex');
}
