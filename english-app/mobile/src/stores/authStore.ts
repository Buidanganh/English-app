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

// ====================================================
// Token storage — dùng biến module (in-memory)
// Không dùng localStorage vì React Native không hỗ trợ
// ====================================================
let _cachedToken: string | null = null;

const saveToken = (token: string | null) => {
  _cachedToken = token;
  setAuthToken(token);
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isInitializing: false,   // Không cần restore token từ storage nữa
  error: null,

  // ==================================================
  // ĐĂNG NHẬP
  // ==================================================
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/login', { email, password });
      const { accessToken, user } = res.data;

      saveToken(accessToken);
      set({ token: accessToken, user, isLoading: false, error: null });
      return true;

    } catch (err: any) {
      let message = 'Đăng nhập thất bại.';

      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        message = '⏱️ Server phản hồi quá chậm. Vui lòng thử lại.';
      } else if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        message = '🔌 Không thể kết nối tới Server. Kiểm tra mạng Internet.';
      } else if (err.response?.status === 401) {
        message = '🔑 Email hoặc mật khẩu không chính xác.';
      } else if (err.response?.status === 400) {
        const msgs = err.response?.data?.message;
        message = Array.isArray(msgs) ? msgs.join('\n') : (msgs || 'Dữ liệu không hợp lệ.');
      } else if (err.response?.status === 500) {
        message = '🛠️ Server đang gặp sự cố. Vui lòng thử lại sau ít phút.';
      } else if (err.response?.data?.message) {
        const msg = err.response.data.message;
        message = Array.isArray(msg) ? msg.join('\n') : msg;
      }

      // Log chi tiết để debug
      console.error('[Login Error]', {
        code: err.code,
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });

      set({ error: message, isLoading: false });
      return false;
    }
  },

  // ==================================================
  // ĐĂNG KÝ
  // ==================================================
  register: async (email, password, fullName) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/register', { email, password, fullName });
      const { accessToken, user } = res.data;

      saveToken(accessToken);
      set({ token: accessToken, user, isLoading: false, error: null });
      return true;

    } catch (err: any) {
      let message = 'Đăng ký thất bại.';

      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        message = '⏱️ Server phản hồi quá chậm. Vui lòng thử lại.';
      } else if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        message = '🔌 Không thể kết nối tới Server. Kiểm tra mạng Internet.';
      } else if (err.response?.status === 409) {
        message = '📧 Email này đã được sử dụng. Vui lòng dùng email khác.';
      } else if (err.response?.status === 400) {
        const msgs = err.response?.data?.message;
        message = Array.isArray(msgs) ? msgs.join('\n') : (msgs || 'Dữ liệu không hợp lệ.');
      } else if (err.response?.status === 500) {
        message = '🛠️ Server đang gặp sự cố. Vui lòng thử lại sau ít phút.';
      } else if (err.response?.data?.message) {
        const msg = err.response.data.message;
        message = Array.isArray(msg) ? msg.join('\n') : msg;
      }

      console.error('[Register Error]', {
        code: err.code,
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });

      set({ error: message, isLoading: false });
      return false;
    }
  },

  // ==================================================
  // LẤY THÔNG TIN PROFILE (sau khi đã login)
  // ==================================================
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
      // Token hết hạn hoặc không hợp lệ → logout
      get().logout();
    }
  },

  // ==================================================
  // ĐĂNG XUẤT
  // ==================================================
  logout: () => {
    saveToken(null);
    set({ user: null, token: null, error: null, isInitializing: false });
  },

  clearError: () => set({ error: null }),
}));
