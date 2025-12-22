/**
 * Base API configuration using Axios
 */
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,  // Required for cross-origin cookies (ngrok/Vercel)
});

// Request interceptor - add auth token when available
api.interceptors.request.use(
  (config) => {
    // Check both localStorage and sessionStorage for token
    const localToken = localStorage.getItem('access_token');
    const sessionToken = sessionStorage.getItem('access_token');
    const token = localToken || sessionToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Debug logging for enrollment requests
    if (config.url?.includes('/enroll') || config.url?.includes('/ai/')) {
      console.log('[API] Request:', config.method?.toUpperCase(), config.url);
      console.log('[API] Token source:', localToken ? 'localStorage' : sessionToken ? 'sessionStorage' : 'none');
      console.log('[API] Has Authorization:', !!config.headers.Authorization);
      if (token) {
        // Show first/last few chars of token for debugging
        console.log('[API] Token preview:', token.substring(0, 20) + '...' + token.substring(token.length - 10));
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || '';

    // Don't redirect on 401 for auth endpoints (login/register return 401 for invalid credentials)
    const isAuthEndpoint = requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register');

    // Don't auto-redirect for enrollment endpoints - let the component handle it
    const isEnrollmentEndpoint = requestUrl.includes('/enroll');

    if (error.response?.status === 401 && !isAuthEndpoint && !isEnrollmentEndpoint) {
      // Token expired or invalid - clear both storages and redirect
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      localStorage.removeItem('remember_me');
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
