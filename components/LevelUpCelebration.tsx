import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Modal, Animated, Dimensions } from 'react-native';
import { Trophy, Sparkles, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface LevelUpCelebrationProps {
  visible: boolean;
  newLevel: number;
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');

export default function LevelUpCelebration({ visible, newLevel, onClose }: LevelUpCelebrationProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnims = useRef([...Array(8)].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (visible) {
      // Main animation sequence
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 20,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start();

      // Sparkle animations
      sparkleAnims.forEach((anim, index) => {
        Animated.loop(
          Animated.sequence([
            Animated.delay(index * 100),
            Animated.timing(anim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        ).start();
      });

      // Auto close after 3 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.3,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      onRequestClose={handleClose}
      animationType="none"
    >
      <Animated.View
        style={[
          styles.overlay,
          { opacity: fadeAnim }
        ]}
      >
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['#9C6ADE', '#FF6B8A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            {/* Sparkles */}
            {sparkleAnims.map((anim, index) => {
              const angle = (index / sparkleAnims.length) * 2 * Math.PI;
              const radius = 100;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;

              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.sparkle,
                    {
                      left: width / 2 + x,
                      top: height / 2 + y,
                      opacity: anim,
                      transform: [{
                        scale: anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.5, 1.5],
                        }),
                      }],
                    },
                  ]}
                >
                  <Star size={20} color="#FFD700" fill="#FFD700" />
                </Animated.View>
              );
            })}

            {/* Main content */}
            <Animated.View
              style={[
                styles.iconContainer,
                { transform: [{ rotate }] }
              ]}
            >
              <Trophy size={80} color="#FFD700" fill="#FFD700" />
            </Animated.View>

            <Text style={styles.title}>Level Up!</Text>
            <Text style={styles.level}>Level {newLevel}</Text>
            <Text style={styles.subtitle}>You're becoming more awesome!</Text>

            <View style={styles.sparklesRow}>
              <Sparkles size={24} color="#FFD700" fill="#FFD700" />
              <Sparkles size={24} color="#FFD700" fill="#FFD700" style={styles.sparklesMiddle} />
              <Sparkles size={24} color="#FFD700" fill="#FFD700" />
            </View>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.85,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  gradient: {
    padding: 40,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  level: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFD700',
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.95,
    marginBottom: 20,
  },
  sparklesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sparklesMiddle: {
    marginHorizontal: 16,
  },
  sparkle: {
    position: 'absolute',
  },
});
