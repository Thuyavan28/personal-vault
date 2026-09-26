// Centralized API configuration & endpoint paths
// Connects frontend to backend seamlessly across local development and production deployment

/**
 * BASE_URL Resolution:
 * 1. Checks `import.meta.env.VITE_API_URL` (set in .env or deployment host like Vercel/Netlify)
 * 2. If running locally on localhost, connects to local Express server http://localhost:5000
 * 3. In production, if VITE_API_URL is set, all API paths automatically route to your deployed backend!
 * 
 * Example deployed backend URL:
 *   https://securevault-backend.onrender.com
 */
export const BASE_URL = (
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000'
    : 'https://personal-vault-zzym-red.vercel.app')
).replace(/\/+$/, '');

// Prefix helper ensuring clean URLs without duplicate slashes
const url = (endpoint) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return BASE_URL ? `${BASE_URL}${cleanEndpoint}` : cleanEndpoint;
};

export const API_PATHS = {
  AUTH: {
    LOGIN: url('/api/auth/login'),
    REGISTER: url('/api/auth/signup'),
    GOOGLE: url('/api/auth/google'),
    GET_USER_INFO: url('/api/auth/me'),
    UPDATE_PROFILE: url('/api/auth/profile'),
  },

  PIN: {
    STATUS: url('/api/pin/status'),
    CREATE: url('/api/pin/create'),
    VERIFY: url('/api/pin/verify'),
    CHANGE: url('/api/pin/change'),
  },

  VAULT: {
    GET_ALL_ITEMS: url('/api/vault/items'),
    GET_ITEMS: (type = 'all', search = '') => {
      let path = `/api/vault/items?type=${encodeURIComponent(type)}`;
      if (search) {
        path += `&search=${encodeURIComponent(search)}`;
      }
      return url(path);
    },
    UPLOAD_ITEM: url('/api/vault/items'),
    CREATE_CREDENTIAL: url('/api/vault/credentials'),
    UNLOCK_ITEM: (itemId) => url(`/api/vault/items/${itemId}/unlock`),
    DOWNLOAD_ITEM: (itemId) => url(`/api/vault/items/${itemId}/download`),
    UPDATE_ITEM: (itemId) => url(`/api/vault/items/${itemId}`),
    DELETE_ITEM: (itemId) => url(`/api/vault/items/${itemId}`),
  },

  AUDIT: {
    GET_LOGS: url('/api/audit/logs'),
    EXPORT_ACCOUNT: url('/api/audit/account'),
  },

  HEALTH: {
    CHECK: url('/api/health'),
  },
};

export default API_PATHS;
