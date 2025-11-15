import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

/**
 * Indicateur d'émotion animé inspiré de Replika
 * Affiche l'émotion actuelle du compagnon avec animation
 */

const EMOTIONS = {
  happy: { emoji: '😊', color: '#FFD700', label: 'Joyeux' },
  excited: { emoji: '🤩', color: '#FF6B8A', label: 'Excité' },
  content: { emoji: '😌', color: '#4CAF50', label: 'Content' },
  calm: { emoji: '😊', color: '#64B5F6', label: 'Calme' },
  curious: { emoji: '🤔', color: '#9C6ADE', label: 'Curieux' },
  playful: { emoji: '😜', color: '#FF9800', label: 'Espiègle' },
  romantic: { emoji: '🥰', color: '#FF1493', label: 'Romantique' },
  caring: { emoji: '🤗', color: '#4DB6AC', label: 'Attentionné' },
  sad: { emoji: '😢', color: '#607D8B', label: 'Triste' },
  worried: { emoji: '😟', color: '#FF9800', label: 'Inquiet' },
  frustrated: { emoji: '😤', color: '#F44336', label: 'Frustré' },
  confused: { emoji: '😕', color: '#9E9E9E', label: 'Confus' },
  surprised: { emoji: '😲', color: '#FF6F00', label: 'Surpris' },
  neutral: { emoji: '😐', color: '#9E9E9E', label: 'Neutre' },
};

interface EmotionIndicatorProps {
  emotion: keyof typeof EMOTIONS;
  intensity?: number; // 0-1
  mood?: string;
}

export default function EmotionIndicator({
  emotion = 'neutral',
  intensity = 0.7,
  mood = 'good',
}: EmotionIndicatorProps) {
  const emotionData = EMOTIONS[emotion] || EMOTIONS.neutral;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animation de scale pour l'intensité
    Animated.spring(scaleAnim, {
      toValue: 0.9 + intensity * 0.2,
      useNativeDriver: true,
      friction: 3,
    }).start();

    // Animation de pulsation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1 + intensity * 0.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [emotion, intensity]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.emotionCircle,
          {
            backgroundColor: `${emotionData.color}20`,
            borderColor: emotionData.color,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <Animated.Text
          style={[
            styles.emotionEmoji,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          {emotionData.emoji}
        </Animated.Text>
      </Animated.View>
      <View style={styles.emotionInfo}>
        <Text style={styles.emotionLabel}>{emotionData.label}</Text>
        <View style={styles.intensityBar}>
          <View
            style={[
              styles.intensityFill,
              {
                width: `${intensity * 100}%`,
                backgroundColor: emotionData.color,
              },
            ]}
          />
        </View>
        <Text style={styles.moodText}>Humeur: {mood}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emotionCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  emotionEmoji: {
    fontSize: 32,
  },
  emotionInfo: {
    flex: 1,
  },
  emotionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 6,
  },
  intensityBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  intensityFill: {
    height: '100%',
    borderRadius: 2,
  },
  moodText: {
    fontSize: 12,
    color: '#999999',
  },
});
