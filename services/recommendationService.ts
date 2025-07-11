import api from './api';

export interface Recommendation {
  id: string;
  type: 'video' | 'music' | 'article';
  title: string;
  description: string;
  url: string;
  imageUrl: string;
}

export const recommendationService = {
  async getRecommendations(): Promise<Recommendation[]> {
    const response = await api.get('/recommendations');
    if (response.data.recommendations) return response.data.recommendations;
    return response.data;
  }
};
