import api from './api';
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
    await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
    
    return response.data;
  },
  
  async login(credentials: LoginData): Promise<AuthResponse> {
    const response = await api.post('/auth/login', credentials);
    
    // Store auth data
    await AsyncStorage.setItem('userToken', response.data.token);
    await AsyncStorage.setItem('userData', JSON.stringify(response.data.user));
    
    return response.data;
  },
  
  async getCurrentUser(): Promise<any> {
    const response = await api.get('/auth/me');
    return response.data.user;
  },
  
  async logout(): Promise<void> {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
  },
  
  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem('userToken');
    return !!token;
  },
  
  async getToken(): Promise<string | null> {
    return AsyncStorage.getItem('userToken');
  },
  
  async getUserData(): Promise<any> {
    const userData = await AsyncStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  }
};