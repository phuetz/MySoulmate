import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Mic } from 'lucide-react-native';

/**
 * Bouton d'entrée vocale avec animation pulsante
 * Inspiré de Google Assistant et Replika
 */

interface VoiceInputButtonProps {
  isRecording: boolean;
  onPress: () => void;
  size?: number;
  color?: string;
}

export default function VoiceInputButton({
  isRecording,
  onPress,
  size = 60,
  color = '#FF6B8A',
}: VoiceInputButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isRecording) {
      // Animation de pulsation pendant l'enregistrement
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );

      pulseAnimation.start();

      return () => {
        pulseAnimation.stop();
      };
    } else {
      pulseAnim.setValue(0);
    }
  }, [isRecording, pulseAnim]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
      friction: 3,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 3,
    }).start();
  };

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.3],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0],
  });

  return (
    <View style={styles.container}>
      {/* Cercles de pulsation pendant l'enregistrement */}
      {isRecording && (
        <>
          <Animated.View
            style={[
              styles.pulseCircle,
              {
                width: size * 1.5,
                height: size * 1.5,
                borderRadius: (size * 1.5) / 2,
                backgroundColor: color,
                opacity: pulseOpacity,
                transform: [{ scale: pulseScale }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.pulseCircle,
              {
                width: size * 1.8,
                height: size * 1.8,
                borderRadius: (size * 1.8) / 2,
                backgroundColor: color,
                opacity: pulseOpacity.interpolate({
                  inputRange: [0, 0.5],
                  outputRange: [0, 0.3],
                }),
                transform: [
                  {
                    scale: pulseScale.interpolate({
                      inputRange: [1, 1.3],
                      outputRange: [1, 1.5],
                    }),
                  },
                ],
              },
            ]}
          />
        </>
      )}

      {/* Bouton principal */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View
          style={[
            styles.button,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: isRecording ? '#FF1744' : color,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Mic size={size * 0.45} color="#FFFFFF" />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  pulseCircle: {
    position: 'absolute',
  },
});
