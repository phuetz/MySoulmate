import api, { getWithCache } from './api';

export interface Gift {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  premium: boolean;
  category: 'common' | 'rare' | 'exclusive';
  effect: string;
  event?: string;
}

export const giftService = {
  async getGifts(): Promise<Gift[]> {
    const response = await getWithCache('/gifts');
    if (response.data.gifts) return response.data.gifts;
    return response.data;
  }
};
