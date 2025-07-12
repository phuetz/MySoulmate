import api, { getWithCache } from './api';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock?: number;
  imageUrl?: string;
  categoryId?: string;
  isActive: boolean;
  category?: {
    id: string;
    name: string;
  };
  owner?: {
    id: string;
    name: string;
  };
}

export interface ProductFilter {
  page?: number;
  limit?: number;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const productService = {
  async getProducts(filters: ProductFilter = {}): Promise<{
    products: Product[];
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
    
    const response = await getWithCache(`/products?${params.toString()}`);
    return response.data;
  },
  
  async getProductById(id: string): Promise<Product> {
    const response = await getWithCache(`/products/${id}`);
    return response.data;
  },
  
  async createProduct(product: Omit<Product, 'id'>): Promise<Product> {
    const response = await api.post('/products', product);
    return response.data.product;
  },
  
  async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    const response = await api.put(`/products/${id}`, product);
    return response.data.product;
  },
  
  async deleteProduct(id: string): Promise<void> {
    await api.delete(`/products/${id}`);
  }
};