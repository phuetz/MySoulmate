import api, { getWithCache } from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export const authService = {
  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await api.post('/auth/register', userData);

    // Store auth data
    await AsyncStorage.setItem('userToken', response.data.token);
    if (response.data.refreshToken) {
      await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
    }
    await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
    
    return response.data;
  },
  
  async login(credentials: LoginData): Promise<AuthResponse> {
    const response = await api.post('/auth/login', credentials);

    // Store auth data
    await AsyncStorage.setItem('userToken', response.data.token);
    if (response.data.refreshToken) {
      await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
    }
    await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
    
    return response.data;
  },
  
  async getCurrentUser(): Promise<any> {
    const response = await getWithCache('/auth/me');
    return response.data.user;
  },
  
  async logout(): Promise<void> {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
    await AsyncStorage.removeItem('refreshToken');
  },
  
  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem('userToken');
    return !!token;
  },
  
  async getToken(): Promise<string | null> {
    return AsyncStorage.getItem('userToken');
  },

  async getRefreshToken(): Promise<string | null> {
    return AsyncStorage.getItem('refreshToken');
  },
  
  async getUserData(): Promise<any> {
    const userData = await AsyncStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  },

  async requestPasswordReset(email: string): Promise<any> {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  async resetPassword(token: string, password: string): Promise<any> {
    const response = await api.post('/auth/reset-password', { token, password });
    return response.data;
  },

  async refreshAccessToken(refreshToken: string): Promise<any> {
    const response = await api.post('/auth/refresh-token', { refreshToken });
    await AsyncStorage.setItem('userToken', response.data.token);
    if (response.data.refreshToken) {
      await AsyncStorage.setItem('refreshToken', response.data.refreshToken);
    }
    return response.data;
  }
};