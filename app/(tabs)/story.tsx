import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { BookOpen, Clock, Star, Lock, Play, RotateCcw, CheckCircle2 } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

interface Story {
  id: string;
  title: string;
  description: string;
  genre: string;
  thumbnailUrl: string;
  isPremium: boolean;
  estimatedDuration: number;
  totalChapters: number;
  difficulty: string;
  tags: string[];
  averageRating: number;
  userProgress?: {
    completedChapterIds: string[];
    completedAt?: string;
    totalAffectionGained: number;
    totalXpGained: number;
  };
}

export default function StoryMode() {
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [isPremium, setIsPremium] = useState(false);

  const genres = ['all', 'romance', 'mystery', 'adventure', 'fantasy', 'slice-of-life'];

  useEffect(() => {
    loadStories();
    checkPremiumStatus();
  }, []);

  const checkPremiumStatus = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setIsPremium(user.isPremium || false);
      }
    } catch (error) {
      console.error('Error checking premium status:', error);
    }
  };

  const loadStories = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/v1/stories', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setStories(data.stories);
      }
    } catch (error) {
      console.error('Error loading stories:', error);
      Alert.alert('Error', 'Failed to load stories');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStories();
  };

  const startStory = async (story: Story) => {
    if (story.isPremium && !isPremium) {
      Alert.alert(
        'Premium Required',
        'This story requires a premium subscription. Upgrade now to enjoy exclusive content!',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => router.push('/settings') }
        ]
      );
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/v1/stories/${story.id}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        // Navigate to story reader
        router.push({
          pathname: `/story/[id]`,
          params: { id: story.id }
        });
      }
    } catch (error) {
      console.error('Error starting story:', error);
      Alert.alert('Error', 'Failed to start story');
    }
  };

  const continueStory = (story: Story) => {
    router.push({
      pathname: `/story/[id]`,
      params: { id: story.id }
    });
  };

  const filteredStories = selectedGenre === 'all'
    ? stories
    : stories.filter(s => s.genre === selectedGenre);

  const renderStoryCard = (story: Story) => {
    const progress = story.userProgress;
    const isCompleted = !!progress?.completedAt;
    const isInProgress = progress && !isCompleted;
    const completionPercentage = progress
      ? (progress.completedChapterIds.length / story.totalChapters) * 100
      : 0;

    return (
      <TouchableOpacity
        key={story.id}
        className="mb-4 bg-white rounded-3xl overflow-hidden shadow-lg"
        onPress={() => isInProgress ? continueStory(story) : startStory(story)}
        activeOpacity={0.7}
      >
        <View className="relative">
          <Image
            source={{ uri: story.thumbnailUrl }}
            className="w-full h-48"
            resizeMode="cover"
          />
          {story.isPremium && (
            <View className="absolute top-3 right-3 bg-purple-500 px-3 py-1 rounded-full flex-row items-center">
              <Lock size={12} color="white" />
              <Text className="text-white text-xs font-bold ml-1">PREMIUM</Text>
            </View>
          )}
          {isCompleted && (
            <View className="absolute top-3 left-3 bg-green-500 px-3 py-1 rounded-full flex-row items-center">
              <CheckCircle2 size={12} color="white" />
              <Text className="text-white text-xs font-bold ml-1">COMPLETED</Text>
            </View>
          )}
          {isInProgress && (
            <View className="absolute bottom-0 left-0 right-0 h-2 bg-gray-200">
              <View
                className="h-full bg-pink-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </View>
          )}
        </View>

        <View className="p-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xl font-bold text-gray-800 flex-1">
              {story.title}
            </Text>
            {story.averageRating > 0 && (
              <View className="flex-row items-center ml-2">
                <Star size={16} color="#FFD700" fill="#FFD700" />
                <Text className="ml-1 text-sm font-semibold text-gray-700">
                  {story.averageRating.toFixed(1)}
                </Text>
              </View>
            )}
          </View>

          <Text className="text-gray-600 mb-3" numberOfLines={2}>
            {story.description}
          </Text>

          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <Clock size={14} color="#9CA3AF" />
              <Text className="ml-1 text-xs text-gray-500">
                {story.estimatedDuration} min
              </Text>
            </View>
            <View className="flex-row items-center">
              <BookOpen size={14} color="#9CA3AF" />
              <Text className="ml-1 text-xs text-gray-500">
                {story.totalChapters} chapters
              </Text>
            </View>
            <View className={`px-2 py-1 rounded-full ${
              story.difficulty === 'easy' ? 'bg-green-100' :
              story.difficulty === 'medium' ? 'bg-yellow-100' :
              'bg-red-100'
            }`}>
              <Text className={`text-xs font-semibold ${
                story.difficulty === 'easy' ? 'text-green-700' :
                story.difficulty === 'medium' ? 'text-yellow-700' :
                'text-red-700'
              }`}>
                {story.difficulty.toUpperCase()}
              </Text>
            </View>
          </View>

          <View className="flex-row flex-wrap mb-3">
            {story.tags.slice(0, 3).map((tag, index) => (
              <View key={index} className="bg-gray-100 px-2 py-1 rounded-full mr-2 mb-1">
                <Text className="text-xs text-gray-600">#{tag}</Text>
              </View>
            ))}
          </View>

          {isCompleted && progress && (
            <View className="bg-gray-50 p-3 rounded-xl mb-2">
              <Text className="text-sm text-gray-600 mb-1">Your rewards:</Text>
              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-gray-600">
                  💖 Affection: +{progress.totalAffectionGained}
                </Text>
                <Text className="text-xs text-gray-600">
                  ⭐ XP: +{progress.totalXpGained}
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            className={`py-3 px-6 rounded-full flex-row items-center justify-center ${
              isInProgress ? 'bg-blue-500' :
              isCompleted ? 'bg-gray-500' :
              'bg-gradient-to-r from-pink-500 to-purple-500'
            }`}
            onPress={() => isInProgress ? continueStory(story) : startStory(story)}
          >
            {isInProgress ? (
              <>
                <Play size={18} color="white" />
                <Text className="text-white font-bold ml-2">Continue ({completionPercentage.toFixed(0)}%)</Text>
              </>
            ) : isCompleted ? (
              <>
                <RotateCcw size={18} color="white" />
                <Text className="text-white font-bold ml-2">Play Again</Text>
              </>
            ) : (
              <>
                <Play size={18} color="white" />
                <Text className="text-white font-bold ml-2">Start Story</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#FF6B8A" />
        <Text className="mt-4 text-gray-600">Loading stories...</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Story Mode',
          headerStyle: { backgroundColor: '#FF6B8A' },
          headerTintColor: 'white',
          headerTitleStyle: { fontWeight: 'bold' }
        }}
      />

      <ScrollView
        className="flex-1 bg-gray-50"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header Banner */}
        <LinearGradient
          colors={['#FF6B8A', '#9C6ADE']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="p-6"
        >
          <View className="flex-row items-center mb-2">
            <BookOpen size={32} color="white" />
            <Text className="text-white text-2xl font-bold ml-3">
              Interactive Stories
            </Text>
          </View>
          <Text className="text-white/90 text-sm">
            Your choices shape the story. Embark on adventures with your companion!
          </Text>
        </LinearGradient>

        {/* Genre Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="py-4 px-4"
        >
          {genres.map((genre) => (
            <TouchableOpacity
              key={genre}
              className={`mr-3 px-4 py-2 rounded-full ${
                selectedGenre === genre
                  ? 'bg-pink-500'
                  : 'bg-white border border-gray-200'
              }`}
              onPress={() => setSelectedGenre(genre)}
            >
              <Text
                className={`font-semibold capitalize ${
                  selectedGenre === genre ? 'text-white' : 'text-gray-700'
                }`}
              >
                {genre === 'slice-of-life' ? 'Slice of Life' : genre}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Stories List */}
        <View className="px-4 pb-6">
          {filteredStories.length === 0 ? (
            <View className="items-center justify-center py-12">
              <BookOpen size={48} color="#9CA3AF" />
              <Text className="text-gray-500 text-center mt-4">
                No stories found in this genre
              </Text>
            </View>
          ) : (
            filteredStories.map(renderStoryCard)
          )}
        </View>
      </ScrollView>
    </>
  );
}
