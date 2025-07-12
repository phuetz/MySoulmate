import api, { getWithCache } from './api';

export interface Companion {
  id: string;
  name: string;
  avatarUrl: string;
  videoUrl: string;
  personalityTraits: { id: number; name: string }[];
  interactions: number;
  messages: number;
  gifts: number;
  days: number;
  relationshipStatus: string;
  nsfwEnabled: boolean;
  notificationsEnabled: boolean;
  purchasedGifts: string[];
  recentActivities: {
    type: 'message' | 'gift' | 'voice' | 'video';
    description: string;
    time: string;
  }[];
  arExperiences: number;
  level: number;
  xp: number;
  achievements: string[];
  videoCallHistory: { duration: number; timestamp: string }[];
  affection: number;
  activeGiftEffects: any[];
}

export const companionService = {
  async getCompanion(): Promise<Companion> {
    const response = await getWithCache('/companion');
    return response.data.companion || response.data;
  }
};
