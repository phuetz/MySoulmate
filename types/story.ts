/**
 * Story Mode Types
 * Interactive narrative system with branching choices
 */

export type StoryGenre = 'adventure' | 'romance' | 'mystery' | 'fantasy' | 'slice-of-life';
export type ChoiceRequirementType = 'affection' | 'level' | 'premium' | 'achievement';

export interface Story {
  id: string;
  title: string;
  description: string;
  genre: StoryGenre;
  thumbnailUrl: string;
  isPremium: boolean;
  estimatedDuration: number; // minutes
  totalChapters: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  chapters: Chapter[];
}

export interface Chapter {
  id: string;
  storyId: string;
  chapterNumber: number;
  title: string;
  content: string;
  imageUrl?: string;
  backgroundMusicUrl?: string;
  affectionImpact: number; // -10 to +10
  xpReward: number;
  choices: Choice[];
  isEnding: boolean;
}

export interface Choice {
  id: string;
  chapterId: string;
  text: string;
  nextChapterId: string | null; // null if ending
  affectionChange: number;
  xpChange: number;
  requirements?: ChoiceRequirement[];
  isOptimal?: boolean; // Best choice indicator
}

export interface ChoiceRequirement {
  type: ChoiceRequirementType;
  value: number | string;
  comparison: 'gte' | 'lte' | 'eq';
  errorMessage: string;
}

export interface UserStoryProgress {
  id: string;
  userId: string;
  storyId: string;
  currentChapterId: string;
  completedChapterIds: string[];
  choicesMade: {
    chapterId: string;
    choiceId: string;
    timestamp: Date;
  }[];
  totalAffectionGained: number;
  totalXpGained: number;
  startedAt: Date;
  lastPlayedAt: Date;
  completedAt?: Date;
  playTime: number; // seconds
}

export interface StoryStats {
  storyId: string;
  totalPlays: number;
  totalCompletions: number;
  completionRate: number;
  averageRating: number;
  averagePlayTime: number;
  popularChoices: {
    chapterId: string;
    choiceId: string;
    count: number;
    percentage: number;
  }[];
}

// Frontend state types
export interface StoryModeState {
  availableStories: Story[];
  currentStory: Story | null;
  currentChapter: Chapter | null;
  userProgress: UserStoryProgress | null;
  isLoading: boolean;
  error: string | null;
}

// API Response types
export interface GetStoriesResponse {
  stories: Story[];
  userProgress: UserStoryProgress[];
}

export interface GetChapterResponse {
  chapter: Chapter;
  progress: UserStoryProgress;
}

export interface MakeChoiceRequest {
  storyId: string;
  chapterId: string;
  choiceId: string;
}

export interface MakeChoiceResponse {
  nextChapter: Chapter | null;
  progress: UserStoryProgress;
  rewards: {
    affection: number;
    xp: number;
    achievements?: string[];
  };
  isStoryComplete: boolean;
}
