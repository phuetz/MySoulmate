import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Simple in-memory cache for GET requests
interface CacheEntry {
  data: any;
  expiresAt: number;
}

const responseCache = new Map<string, CacheEntry>();
const DEFAULT_TTL = 60 * 1000; // 1 minute

// Base URL for API calls
const API_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  process.env.EXPO_PUBLIC_API_URL ||
  'http://localhost:3000/api/v1';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token in requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Handle unauthorized errors (expired token)
    if (error.response && error.response.status === 401) {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      // In a real app, you might want to redirect to login
    }
    return Promise.reject(error);
  }
);

export default api;

export async function getWithCache(url: string, config: any = {}, ttl = DEFAULT_TTL) {
  const key = url + JSON.stringify(config?.params || {});
  const cached = responseCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }
  const response = await api.get(url, config);
  responseCache.set(key, { data: response, expiresAt: Date.now() + ttl });
  return response;
}

export const cacheUtils = {
  clear: () => responseCache.clear(),
  size: () => responseCache.size,
};