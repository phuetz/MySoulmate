import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronRight, Heart, Zap, Star, X } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

interface Chapter {
  id: string;
  chapterNumber: number;
  title: string;
  content: string;
  imageUrl?: string;
  affectionImpact: number;
  xpReward: number;
  isEnding: boolean;
  choices: Choice[];
}

interface Choice {
  id: string;
  text: string;
  affectionChange: number;
  xpChange: number;
  isOptimal: boolean;
  requirements?: any[];
}

interface StoryProgress {
  id: string;
  completedChapterIds: string[];
  totalAffectionGained: number;
  totalXpGained: number;
  completedAt?: string;
}

export default function StoryReader() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [progress, setProgress] = useState<StoryProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [makingChoice, setMakingChoice] = useState(false);
  const [showRewards, setShowRewards] = useState(false);
  const [lastRewards, setLastRewards] = useState({ affection: 0, xp: 0 });

  useEffect(() => {
    loadCurrentChapter();
  }, [id]);

  const loadCurrentChapter = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/v1/stories/${id}/current`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setChapter(data.chapter);
        setProgress(data.progress);
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      console.error('Error loading chapter:', error);
      Alert.alert('Error', 'Failed to load chapter');
    } finally {
      setLoading(false);
    }
  };

  const handleChoice = async (choice: Choice) => {
    if (makingChoice) return;

    setMakingChoice(true);

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/v1/stories/choice', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          storyId: id,
          chapterId: chapter?.id,
          choiceId: choice.id
        })
      });

      const data = await response.json();

      if (data.success) {
        // Show rewards
        setLastRewards(data.rewards);
        setShowRewards(true);

        // Wait a moment before proceeding
        setTimeout(() => {
          setShowRewards(false);

          if (data.isStoryComplete) {
            // Story completed!
            showCompletionDialog();
          } else if (data.nextChapter) {
            // Load next chapter
            setChapter(data.nextChapter);
            setProgress(data.progress);
          }
        }, 2000);
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      console.error('Error making choice:', error);
      Alert.alert('Error', 'Failed to process choice');
    } finally {
      setMakingChoice(false);
    }
  };

  const showCompletionDialog = () => {
    Alert.alert(
      '🎉 Story Complete!',
      `Congratulations! You've completed this story.\n\n💖 Total Affection: +${progress?.totalAffectionGained}\n⭐ Total XP: +${progress?.totalXpGained}`,
      [
        {
          text: 'Rate Story',
          onPress: () => showRatingDialog()
        },
        {
          text: 'Back to Stories',
          onPress: () => router.back()
        }
      ]
    );
  };

  const showRatingDialog = () => {
    // In a real app, show a custom rating UI
    Alert.prompt(
      'Rate This Story',
      'How would you rate this story? (1-5 stars)',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => router.back()
        },
        {
          text: 'Submit',
          onPress: async (rating) => {
            await submitRating(parseInt(rating || '5'));
            router.back();
          }
        }
      ],
      'plain-text',
      '5'
    );
  };

  const submitRating = async (rating: number) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await fetch(`http://localhost:3000/api/v1/stories/${id}/rate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rating })
      });
    } catch (error) {
      console.error('Error submitting rating:', error);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-900">
        <ActivityIndicator size="large" color="#FF6B8A" />
        <Text className="mt-4 text-white">Loading chapter...</Text>
      </View>
    );
  }

  if (!chapter) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-900">
        <Text className="text-white text-lg">Chapter not found</Text>
        <TouchableOpacity
          className="mt-4 bg-pink-500 px-6 py-3 rounded-full"
          onPress={() => router.back()}
        >
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: `Chapter ${chapter.chapterNumber}`,
          headerStyle: { backgroundColor: '#1F2937' },
          headerTintColor: 'white',
          headerRight: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <X size={24} color="white" />
            </TouchableOpacity>
          )
        }}
      />

      <View className="flex-1 bg-gray-900">
        <ScrollView className="flex-1">
          {/* Chapter Image */}
          {chapter.imageUrl && (
            <Image
              source={{ uri: chapter.imageUrl }}
              className="w-full h-64"
              resizeMode="cover"
            />
          )}

          {/* Progress Indicator */}
          {progress && (
            <View className="bg-gray-800 px-4 py-3">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-white text-sm font-semibold">
                  Chapter {chapter.chapterNumber}
                </Text>
                <View className="flex-row items-center">
                  <Heart size={16} color="#FF6B8A" fill="#FF6B8A" />
                  <Text className="text-white text-sm ml-1">
                    +{progress.totalAffectionGained}
                  </Text>
                  <Zap size={16} color="#FFD700" fill="#FFD700" className="ml-3" />
                  <Text className="text-white text-sm ml-1">
                    +{progress.totalXpGained}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Chapter Content */}
          <View className="p-6">
            <Text className="text-white text-2xl font-bold mb-4">
              {chapter.title}
            </Text>

            <Text className="text-white/90 text-base leading-7 mb-6">
              {chapter.content}
            </Text>

            {/* Choices */}
            {chapter.choices && chapter.choices.length > 0 && (
              <View className="mt-6">
                <Text className="text-white text-lg font-semibold mb-4">
                  What do you do?
                </Text>

                {chapter.choices.map((choice, index) => (
                  <TouchableOpacity
                    key={choice.id}
                    className={`mb-4 p-5 rounded-2xl border-2 ${
                      choice.isOptimal
                        ? 'bg-purple-900/40 border-purple-500'
                        : 'bg-gray-800/40 border-gray-700'
                    }`}
                    onPress={() => handleChoice(choice)}
                    disabled={makingChoice}
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-start justify-between">
                      <Text className="text-white text-base flex-1 leading-6">
                        {choice.text}
                      </Text>
                      <ChevronRight size={20} color="white" className="ml-2" />
                    </View>

                    {/* Show rewards preview */}
                    <View className="flex-row items-center mt-3 pt-3 border-t border-gray-700">
                      {choice.affectionChange !== 0 && (
                        <View className="flex-row items-center mr-4">
                          <Heart size={14} color="#FF6B8A" fill={choice.affectionChange > 0 ? "#FF6B8A" : "transparent"} />
                          <Text className={`ml-1 text-sm ${
                            choice.affectionChange > 0 ? 'text-pink-400' : 'text-gray-500'
                          }`}>
                            {choice.affectionChange > 0 ? '+' : ''}{choice.affectionChange}
                          </Text>
                        </View>
                      )}
                      {choice.xpChange !== 0 && (
                        <View className="flex-row items-center">
                          <Zap size={14} color="#FFD700" fill={choice.xpChange > 0 ? "#FFD700" : "transparent"} />
                          <Text className={`ml-1 text-sm ${
                            choice.xpChange > 0 ? 'text-yellow-400' : 'text-gray-500'
                          }`}>
                            {choice.xpChange > 0 ? '+' : ''}{choice.xpChange}
                          </Text>
                        </View>
                      )}
                      {choice.isOptimal && (
                        <View className="flex-row items-center ml-auto">
                          <Star size={14} color="#A78BFA" fill="#A78BFA" />
                          <Text className="ml-1 text-xs text-purple-400">Best Choice</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {chapter.isEnding && (
              <View className="mt-6 bg-gradient-to-r from-pink-900/40 to-purple-900/40 p-6 rounded-2xl border-2 border-pink-500">
                <Text className="text-white text-center text-xl font-bold">
                  ✨ The End ✨
                </Text>
                <Text className="text-white/80 text-center mt-2">
                  You've completed this story!
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Rewards Animation Overlay */}
        {showRewards && (
          <View className="absolute inset-0 justify-center items-center bg-black/70">
            <LinearGradient
              colors={['#FF6B8A', '#9C6ADE']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="p-8 rounded-3xl"
            >
              <Text className="text-white text-2xl font-bold text-center mb-4">
                Rewards Earned!
              </Text>
              <View className="flex-row items-center justify-center mb-3">
                <Heart size={32} color="white" fill="white" />
                <Text className="text-white text-3xl font-bold ml-3">
                  +{lastRewards.affection}
                </Text>
              </View>
              <View className="flex-row items-center justify-center">
                <Zap size={32} color="white" fill="white" />
                <Text className="text-white text-3xl font-bold ml-3">
                  +{lastRewards.xp}
                </Text>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Loading Overlay */}
        {makingChoice && (
          <View className="absolute inset-0 justify-center items-center bg-black/50">
            <ActivityIndicator size="large" color="#FF6B8A" />
          </View>
        )}
      </View>
    </>
  );
}
