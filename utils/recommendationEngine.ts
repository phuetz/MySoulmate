interface Story {
  id: string;
  title: string;
  genre: string;
  averageRating: number;
  tags: string[];
  userProgress?: {
    completedAt?: string;
  };
}

interface UserHistory {
  completedStories: string[];
  favoriteGenres: string[];
  avgSessionDuration: number;
}

/**
 * Simple collaborative filtering based on genre and ratings
 */
export function getRecommendedStories(
  currentStory: Story,
  allStories: Story[],
  userHistory?: UserHistory,
  limit: number = 3
): Story[] {
  // Filter out current story
  const candidateStories = allStories.filter(s => s.id !== currentStory.id);

  // Score each story
  const scoredStories = candidateStories.map(story => ({
    story,
    score: calculateRecommendationScore(story, currentStory, userHistory),
  }));

  // Sort by score descending
  scoredStories.sort((a, b) => b.score - a.score);

  // Return top N
  return scoredStories.slice(0, limit).map(s => s.story);
}

function calculateRecommendationScore(
  story: Story,
  currentStory: Story,
  userHistory?: UserHistory
): number {
  let score = 0;

  // Same genre = high score
  if (story.genre === currentStory.genre) {
    score += 50;
  }

  // High rating = bonus
  score += story.averageRating * 10;

  // User favorite genres
  if (userHistory?.favoriteGenres.includes(story.genre)) {
    score += 30;
  }

  // Tag similarity
  const commonTags = story.tags.filter(tag => currentStory.tags.includes(tag));
  score += commonTags.length * 5;

  // Already completed = penalty
  if (story.userProgress?.completedAt) {
    score -= 20;
  }

  return score;
}

/**
 * Get featured stories based on popularity and ratings
 */
export function getFeaturedStories(allStories: Story[], limit: number = 3): Story[] {
  return allStories
    .filter(s => s.averageRating >= 4.5)
    .sort((a, b) => b.averageRating - a.averageRating)
    .slice(0, limit);
}

/**
 * Get trending stories (most completed recently)
 */
export function getTrendingStories(allStories: Story[], limit: number = 5): Story[] {
  // In a real implementation, this would query a database for recent completions
  // For now, we'll use rating as a proxy
  return allStories
    .sort((a, b) => b.averageRating - a.averageRating)
    .slice(0, limit);
}

/**
 * Get personalized recommendations based on user history
 */
export function getPersonalizedRecommendations(
  allStories: Story[],
  userHistory: UserHistory,
  limit: number = 5
): Story[] {
  if (!userHistory.favoriteGenres || userHistory.favoriteGenres.length === 0) {
    // No history - return top-rated
    return getTrendingStories(allStories, limit);
  }

  // Filter by favorite genres
  const genreMatches = allStories.filter(s =>
    userHistory.favoriteGenres.includes(s.genre)
  );

  // Sort by rating
  genreMatches.sort((a, b) => b.averageRating - a.averageRating);

  return genreMatches.slice(0, limit);
}
