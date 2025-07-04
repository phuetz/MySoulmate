import api from './api';

export interface Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  products?: any[];
}

export const categoryService = {
  async getCategories(): Promise<Category[]> {
    const response = await api.get('/categories');
    return response.data;
  },
  
  async getCategoryById(id: string): Promise<Category> {
    const response = await api.get(`/categories/${id}`);
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
  }
};