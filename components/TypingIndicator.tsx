import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

/**
 * Indicateur de frappe animé avec points qui rebondissent
 * Inspiré de Messenger et Replika
 */

interface TypingIndicatorProps {
  visible: boolean;
  avatarUrl?: string;
}

export default function TypingIndicator({ visible, avatarUrl }: TypingIndicatorProps) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Animation séquentielle pour chaque point
      const createDotAnimation = (dot: Animated.Value, delay: number) => {
        return Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: -8,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]);
      };

      // Boucle infinie d'animation
      const animation = Animated.loop(
        Animated.parallel([
          createDotAnimation(dot1, 0),
          createDotAnimation(dot2, 150),
          createDotAnimation(dot3, 300),
        ])
      );

      animation.start();

      return () => animation.stop();
    } else {
      // Reset les positions
      dot1.setValue(0);
      dot2.setValue(0);
      dot3.setValue(0);
    }
  }, [visible, dot1, dot2, dot3]);

  if (!visible) return null;

  return (
    <View style={styles.container}>
      {avatarUrl && (
        <View style={styles.avatarPlaceholder} />
      )}
      <View style={styles.bubbleContainer}>
        <View style={styles.bubble}>
          <Animated.View
            style={[
              styles.dot,
              {
                transform: [{ translateY: dot1 }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              {
                transform: [{ translateY: dot2 }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              {
                transform: [{ translateY: dot3 }],
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
    maxWidth: '80%',
    alignSelf: 'flex-start',
  },
  avatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E1E1E1',
    marginRight: 8,
  },
  bubbleContainer: {
    backgroundColor: '#F0F0F0',
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    padding: 12,
    paddingHorizontal: 16,
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9C6ADE',
    marginHorizontal: 2,
  },
});
