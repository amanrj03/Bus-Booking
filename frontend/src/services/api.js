import axios from 'axios';

// Normalize baseURL so both `https://api.domain.com` and `https://api.domain.com/api/v1` work without 404s
const rawBaseURL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.trim().replace(/\/+$/, '') : '';
const normalizedBaseURL = rawBaseURL
  ? (rawBaseURL.endsWith('/api/v1') ? rawBaseURL : `${rawBaseURL}/api/v1`)
  : '/api/v1';

const api = axios.create({
  baseURL: normalizedBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for unified error extraction
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const customError = {
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || 'Network request failed',
      errors: error.response?.data?.errors || null,
    };
    return Promise.reject(customError);
  }
);

export default api;
