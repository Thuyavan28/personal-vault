// General utility and formatting helper functions

/**
 * Format raw byte size into human readable string (KB, MB, GB)
 */
export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format ISO date string into readable local representation
 */
export function formatDate(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Validate standard email format
 */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

/**
 * Validate 4-digit PIN
 */
export function isValidPin(pin) {
  return /^\d{4}$/.test(String(pin || '').trim());
}

/**
 * Mask sensitive string for display
 */
export function maskString(str, visibleChars = 2) {
  if (!str) return '••••••••';
  if (str.length <= visibleChars) return '••••';
  return str.slice(0, visibleChars) + '••••••••';
}
