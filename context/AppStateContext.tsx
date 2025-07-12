import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FlatList } from 'react-native';
import { companionService } from '@/services/companionService';

// Define types
interface GiftEffect {
  giftId: string;
  description: string;
  expiresAt: number;
}

interface CompanionData {
  id: string;
  name: string;
  avatarUrl: string;
  avatarName?: string;
  videoUrl?: string;
  personalityTraits: any[];
  interactions: number;
  messages: number;
  gifts: number;
  days: number;
  relationshipStatus: 'Acquaintance' | 'Friend' | 'Close Friend' | 'Romantic';
  nsfwEnabled: boolean;
  notificationsEnabled: boolean;
  purchasedGifts?: string[];
  recentActivities: {
    type: 'message' | 'gift' | 'voice' | 'video';
    description: string;
    time: string;
  }[];
  isPremium?: boolean;
  arExperiences?: number; // Track number of AR experiences
  level?: number; // Gamification level
  xp?: number; // Experience points
  achievements?: string[]; // Unlocked achievements
  videoCallHistory?: { duration: number; timestamp: string }[]; // Video call logs
  affection?: number; // Affection level increased by gifts
  activeGiftEffects?: GiftEffect[]; // Currently active gift effects
}

interface AppStateContextType {
  companion: CompanionData;
  updateCompanion: (data: CompanionData) => void;
  updateInteractions: (count: number) => void;
  addVideoCall: (duration: number) => void;
  isPremium: boolean;
  setIsPremium: (value: boolean) => void;
  verified: boolean;
  setVerified: (value: boolean) => void;
  virtualCurrency: number;
  setVirtualCurrency: React.Dispatch<React.SetStateAction<number>>;
  unreadNotifications: number;
  setUnreadNotifications: React.Dispatch<React.SetStateAction<number>>;
  selectedVoice: string | null;
  setSelectedVoice: React.Dispatch<React.SetStateAction<string | null>>;
}

// Create context
const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

// Default companion data
const defaultCompanion: CompanionData = {
  id: '1',
  name: 'Sophia',
  avatarUrl: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=600',
  videoUrl: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=600',
  personalityTraits: [
    { id: 1, name: 'Caring' },
    { id: 3, name: 'Intelligent' },
    { id: 5, name: 'Witty' }
  ],
  interactions: 12,
  messages: 37,
  gifts: 2,
  days: 5,
  relationshipStatus: 'Friend',
  nsfwEnabled: false,
  notificationsEnabled: true,
  purchasedGifts: ['1', '2'],
  recentActivities: [
    {
      type: 'message',
      description: 'Shared a funny story about her day',
      time: '2 hours ago'
    },
    {
      type: 'gift',
      description: 'You sent a virtual flower bouquet',
      time: 'Yesterday'
    },
    {
      type: 'voice',
      description: 'Had a 15-minute voice conversation',
      time: '2 days ago'
    }
  ],
  arExperiences: 0,
  level: 1,
  xp: 150,
  achievements: ['first_conversation', 'early_bird'],
  videoCallHistory: [],
  affection: 0,
  activeGiftEffects: []
};

// Provider component
export function AppStateProvider({ children }: { children: ReactNode }) {
  const [companion, setCompanion] = useState<CompanionData>(defaultCompanion);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [verified, setVerified] = useState<boolean>(false);
  const [virtualCurrency, setVirtualCurrency] = useState<number>(300);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(3);
  const [selectedVoice, setSelectedVoice] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompanion = async () => {
      try {
        const data = await companionService.getCompanion();
        setCompanion(data);
      } catch (err) {
        console.log('Failed to load companion data', err);
      }
    };
    fetchCompanion();
  }, []);

  const updateCompanion = (data: CompanionData) => {
    setCompanion(data);
  };

  const getRelationshipStatus = (interactions: number) => {
    if (interactions > 50) return 'Romantic';
    if (interactions > 30) return 'Close Friend';
    if (interactions > 10) return 'Friend';
    return 'Acquaintance';
  };

  const updateInteractions = (count: number) => {
    setCompanion(prev => {
      const newInteractions = (prev.interactions || 0) + count;
      const newXp = (prev.xp || 0) + count * 10;
      const updated = {
        ...prev,
        interactions: newInteractions,
        messages: (prev.messages || 0) + (count > 0 ? 1 : 0),
        arExperiences: (prev.arExperiences || 0) + (count === 5 ? 1 : 0),
        xp: newXp,
        level: Math.floor(newXp / 100) + 1,
        relationshipStatus: getRelationshipStatus(newInteractions)
      } as CompanionData;
      return updated;
    });
  };

  const addVideoCall = (duration: number) => {
    setCompanion(prev => {
      const newHistory = [
        { duration, timestamp: new Date().toISOString() },
        ...(prev.videoCallHistory || [])
      ];
      return { ...prev, videoCallHistory: newHistory } as CompanionData;
    });
  };

  // Remove expired gift effects every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCompanion(prev => {
        const effects = prev.activeGiftEffects || [];
        if (effects.length === 0) return prev;
        const now = Date.now();
        const filtered = effects.filter(e => e.expiresAt > now);
        if (filtered.length === effects.length) return prev;
        return { ...prev, activeGiftEffects: filtered } as CompanionData;
      });
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Simulate notifications coming in periodically
    const interval = setInterval(() => {
      // Only add new notifications if they're enabled
      if (companion.notificationsEnabled) {
        // Randomly decide whether to add a notification (20% chance)
        if (Math.random() < 0.2) {
          setUnreadNotifications(prev => prev + 1);
        }
      }
    }, 60000); // Every minute
    
    return () => clearInterval(interval);
  }, [companion.notificationsEnabled]);

  return (
    <AppStateContext.Provider 
      value={{ 
        companion, 
        updateCompanion, 
        updateInteractions,
        addVideoCall,
        isPremium,
        setIsPremium,
        verified,
        setVerified,
        virtualCurrency,
        setVirtualCurrency,
        unreadNotifications,
        setUnreadNotifications,
        selectedVoice,
        setSelectedVoice
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

// Custom hook for using the context
export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}