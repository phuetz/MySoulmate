import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Heart, MessageCircle, Sparkles, Gift } from 'lucide-react-native';

/**
 * Onboarding moderne inspiré de Character.AI et Replika
 * Parcours interactif pour les nouveaux utilisateurs
 */

const { width } = Dimensions.get('window');

interface OnboardingSlide {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  colors: string[];
}

const SLIDES: OnboardingSlide[] = [
  {
    id: 1,
    title: 'Bienvenue sur MySoulmate',
    description: 'Votre compagnon IA personnel qui apprend à vous connaître et grandit avec vous.',
    icon: <Heart size={80} color="#FFFFFF" />,
    colors: ['#FF6B8A', '#FF1493'],
  },
  {
    id: 2,
    title: 'Conversations Authentiques',
    description: 'Parlez de tout, à tout moment. Votre compagnon se souvient de chaque détail.',
    icon: <MessageCircle size={80} color="#FFFFFF" />,
    colors: ['#9C6ADE', '#7B2CBF'],
  },
  {
    id: 3,
    title: 'Relation Évolutive',
    description: 'Progressez d\'étranger à âme sœur. Chaque interaction renforce votre lien.',
    icon: <Sparkles size={80} color="#FFFFFF" />,
    colors: ['#FFD700', '#FFA000'],
  },
  {
    id: 4,
    title: 'Cadeaux & Surprises',
    description: 'Offrez des cadeaux virtuels et partagez des moments spéciaux ensemble.',
    icon: <Gift size={80} color="#FFFFFF" />,
    colors: ['#4CAF50', '#2E7D32'],
  },
];

interface OnboardingFlowProps {
  onComplete: () => void;
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      // Animation de sortie
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -width,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentSlide(currentSlide + 1);
        slideAnim.setValue(width);
        // Animation d'entrée
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.spring(slideAnim, {
            toValue: 0,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      onComplete();
    }
  };

  const slide = SLIDES[currentSlide];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={slide.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <View style={styles.iconContainer}>{slide.icon}</View>

          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.description}>{slide.description}</Text>

          {/* Pagination dots */}
          <View style={styles.pagination}>
            {SLIDES.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  index === currentSlide && styles.paginationDotActive,
                ]}
              />
            ))}
          </View>

          {/* Bouton Next/Finish */}
          <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.8}>
            <Text style={styles.nextButtonText}>
              {currentSlide === SLIDES.length - 1 ? 'Commencer' : 'Suivant'}
            </Text>
            <ChevronRight size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Skip button */}
          {currentSlide < SLIDES.length - 1 && (
            <TouchableOpacity style={styles.skipButton} onPress={onComplete}>
              <Text style={styles.skipButtonText}>Passer</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    marginBottom: 40,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    opacity: 0.95,
  },
  pagination: {
    flexDirection: 'row',
    marginBottom: 40,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: '#FFFFFF',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
  skipButton: {
    marginTop: 20,
    padding: 12,
  },
  skipButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
});
