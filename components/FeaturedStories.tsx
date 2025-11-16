import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { Star, Clock, BookOpen } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Story {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  averageRating: number;
  estimatedDuration: number;
  totalChapters: number;
}

interface FeaturedStoriesProps {
  stories: Story[];
  onStoryPress: (story: Story) => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.75;
const CARD_MARGIN = 16;

export default function FeaturedStories({ stories, onStoryPress }: FeaturedStoriesProps) {
  const scrollX = useRef(new Animated.Value(0)).current;
  const [activeIndex, setActiveIndex] = useState(0);

  if (!stories || stories.length === 0) return null;

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / (CARD_WIDTH + CARD_MARGIN * 2));
        setActiveIndex(index);
      },
    }
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>⭐ Featured This Week</Text>
        <Text style={styles.subtitle}>Top-rated interactive stories</Text>
      </View>

      <ScrollView
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + CARD_MARGIN * 2}
        snapToAlignment="start"
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {stories.map((story, index) => {
          const inputRange = [
            (index - 1) * (CARD_WIDTH + CARD_MARGIN * 2),
            index * (CARD_WIDTH + CARD_MARGIN * 2),
            (index + 1) * (CARD_WIDTH + CARD_MARGIN * 2),
          ];

          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.9, 1, 0.9],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.6, 1, 0.6],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={story.id}
              style={[
                styles.cardContainer,
                {
                  transform: [{ scale }],
                  opacity,
                },
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => onStoryPress(story)}
              >
                <View style={styles.card}>
                  <Image
                    source={{ uri: story.thumbnailUrl }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.8)']}
                    style={styles.gradient}
                  >
                    <View style={styles.content}>
                      <View style={styles.rating}>
                        <Star size={18} color="#FFD700" fill="#FFD700" />
                        <Text style={styles.ratingText}>{story.averageRating.toFixed(1)}</Text>
                      </View>

                      <Text style={styles.storyTitle} numberOfLines={2}>
                        {story.title}
                      </Text>

                      <Text style={styles.description} numberOfLines={2}>
                        {story.description}
                      </Text>

                      <View style={styles.meta}>
                        <View style={styles.metaItem}>
                          <Clock size={14} color="#FFFFFF" />
                          <Text style={styles.metaText}>{story.estimatedDuration} min</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <BookOpen size={14} color="#FFFFFF" />
                          <Text style={styles.metaText}>{story.totalChapters} chapters</Text>
                        </View>
                      </View>
                    </View>
                  </LinearGradient>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </ScrollView>

      {/* Pagination dots */}
      <View style={styles.pagination}>
        {stories.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              activeIndex === index && styles.dotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#333333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  scrollContent: {
    paddingHorizontal: (width - CARD_WIDTH) / 2,
  },
  cardContainer: {
    width: CARD_WIDTH,
    marginHorizontal: CARD_MARGIN,
  },
  card: {
    width: '100%',
    height: 280,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    padding: 20,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  ratingText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  storyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  description: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 12,
    lineHeight: 20,
  },
  meta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  dotActive: {
    backgroundColor: '#FF6B8A',
    width: 24,
  },
});
