import axios from 'axios';
import { BASE_URL } from './apiPath.js';

// Pre-configured Axios instance with authorization interceptor
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach JWT bearer token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('securevault_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle common auth and server errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && !error.config.url.includes('/api/auth/login')) {
        console.warn('[Axios] Session unauthorized, credentials may need refresh.');
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
