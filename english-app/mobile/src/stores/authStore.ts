import { create } from 'zustand';
import { api, setAuthToken } from '../services/api';

interface User {
  id: string;
  email: string;
  fullName: string;
  streakCount: number;
  totalXp: number;
  role?: string;
  subscriptionTier?: string;
  createdAt?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, fullName: string) => Promise<boolean>;
  fetchProfile: () => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

// Khôi phục token từ storage nếu có
const savedToken = typeof window !== 'undefined' && window.localStorage ? localStorage.getItem('access_token') : null;
if (savedToken) {
  setAuthToken(savedToken);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: savedToken,
  isLoading: false,
  isInitializing: !!savedToken,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/login', { email, password });
      const { accessToken, user } = res.data;
      
      setAuthToken(accessToken);
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('access_token', accessToken);
      }

      set({ token: accessToken, user, isLoading: false });
      return true;
    } catch (err: any) {
      let message = 'Đăng nhập thất bại.';
      if (err.response?.status === 401) {
        message = '🔑 Email hoặc mật khẩu không chính xác! Vui lòng kiểm tra lại.';
      } else if (err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
        message = '🔌 Không thể kết nối tới Backend Server! Hãy kiểm tra xem Server NestJS ở Terminal 1 (http://localhost:3000) đã chạy chưa.';
      } else if (err.response?.data?.message) {
        const msg = err.response.data.message;
        message = Array.isArray(msg) ? msg.join(', ') : msg;
      }
      set({ error: message, isLoading: false });
      return false;
    }
  },

  register: async (email, password, fullName) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/register', { email, password, fullName });
      const { accessToken, user } = res.data;
      
      setAuthToken(accessToken);
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('access_token', accessToken);
      }

      set({ token: accessToken, user, isLoading: false });
      return true;
    } catch (err: any) {
      let message = 'Đăng ký thất bại.';
      if (err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
        message = '🔌 Không thể kết nối tới Backend Server! Hãy kiểm tra xem Server NestJS ở Terminal 1 (http://localhost:3000) đã chạy chưa.';
      } else if (err.response?.data?.message) {
        const msg = err.response.data.message;
        message = Array.isArray(msg) ? msg.join(', ') : msg;
      }
      set({ error: message, isLoading: false });
      return false;
    }
  },

  fetchProfile: async () => {
    const { token } = get();
    if (!token) {
      set({ isInitializing: false });
      return;
    }

    try {
      setAuthToken(token);
      const res = await api.get('/auth/profile');
      set({ user: res.data, isInitializing: false });
    } catch (err) {
      get().logout();
      set({ isInitializing: false });
    }
  },

  logout: () => {
    setAuthToken(null);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('access_token');
    }
    set({ user: null, token: null, error: null, isInitializing: false });
  },

  clearError: () => set({ error: null }),
}));
