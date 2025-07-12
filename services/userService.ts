import api, { getWithCache } from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  products?: any[];
}

export interface UserFilter {
  page?: number;
  limit?: number;
}

export const userService = {
  async getUsers(filters: UserFilter = {}): Promise<{
    users: User[];
    totalPages: number;
    currentPage: number;
    totalItems: number;
  }> {
    // Convert filters to query string
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });
    
    const response = await getWithCache(`/users?${params.toString()}`);
    return response.data;
  },
  
  async getUserById(id: string): Promise<User> {
    const response = await getWithCache(`/users/${id}`);
    return response.data;
  },
  
  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const response = await api.put(`/users/${id}`, userData);
    return response.data.user;
  },
  
  async deleteUser(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  }
};