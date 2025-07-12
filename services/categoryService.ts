import api, { getWithCache } from './api';

export interface Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  products?: any[];
}

export const categoryService = {
  async getCategories(params: {
    page?: number;
    limit?: number;
    search?: string;
    active?: boolean;
    sort?: string;
    order?: 'asc' | 'desc';
  } = {}): Promise<any> {
    const response = await getWithCache('/categories', { params });
    return response.data;
  },
  
  async getCategoryById(id: string): Promise<Category> {
    const response = await getWithCache(`/categories/${id}`);
    return response.data;
  },
  
  async createCategory(category: Omit<Category, 'id'>): Promise<Category> {
    const response = await api.post('/categories', category);
    return response.data.category;
  },
  
  async updateCategory(id: string, category: Partial<Category>): Promise<Category> {
    const response = await api.put(`/categories/${id}`, category);
    return response.data.category;
  },
  
  async deleteCategory(id: string): Promise<void> {
    await api.delete(`/categories/${id}`);
  }};