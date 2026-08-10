import axios from 'axios';
import { Platform } from 'react-native';

const BASE_URL = Platform.OS === 'web' ? 'http://localhost:3000' : 'http://192.168.0.143:3000';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};
