import axios from 'axios';

// ====================================================
// BASE URL — Đang trỏ đến Railway backend production
// ====================================================
const BASE_URL = 'https://caring-flow-production-4f54.up.railway.app';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000, // 20s — Railway cold start có thể mất đến 15s
});

// Request interceptor — log mọi request để debug
api.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — log lỗi
api.interceptors.response.use(
  (response) => {
    console.log(`[API] ✅ ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`[API] ❌ ${error.response?.status || 'NETWORK'} ${error.config?.url}`, {
      data: error.response?.data,
      message: error.message,
    });
    return Promise.reject(error);
  },
);

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};
