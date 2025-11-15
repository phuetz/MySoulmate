import React, { useRef } from 'react';
import { View, StyleSheet, Animated, PanResponder, ViewStyle } from 'react-native';
import { Reply } from 'lucide-react-native';

/**
 * Message avec geste de balayage pour répondre
 * Inspiré de WhatsApp et Telegram - Swipe left/right to reply
 */

interface SwipeableMessageProps {
  children: React.ReactNode;
  onSwipeToReply: () => void;
  isUser: boolean;
  style?: ViewStyle;
}

export default function SwipeableMessage({
  children,
  onSwipeToReply,
  isUser,
  style,
}: SwipeableMessageProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const replyIconOpacity = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Activer le geste si swipe horizontal significatif
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderMove: (_, gestureState) => {
        // Limiter le mouvement selon le côté du message
        const maxSwipe = 60;
        let newValue = gestureState.dx;

        if (isUser) {
          // Messages utilisateur: swipe vers la gauche seulement
          newValue = Math.min(0, Math.max(-maxSwipe, gestureState.dx));
        } else {
          // Messages compagnon: swipe vers la droite seulement
          newValue = Math.max(0, Math.min(maxSwipe, gestureState.dx));
        }

        translateX.setValue(newValue);

        // Opacité de l'icône augmente avec le swipe
        const opacity = Math.min(Math.abs(newValue) / maxSwipe, 1);
        replyIconOpacity.setValue(opacity);
      },
      onPanResponderRelease: (_, gestureState) => {
        const threshold = 40;
        const shouldTriggerReply = Math.abs(gestureState.dx) > threshold;

        if (shouldTriggerReply) {
          // Déclencher la réponse
          onSwipeToReply();
        }

        // Animer le retour à la position initiale
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: 0,
            friction: 7,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.timing(replyIconOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      },
    })
  ).current;

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[
          styles.swipeContainer,
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Icône de réponse à gauche pour messages utilisateur */}
        {isUser && (
          <Animated.View
            style={[
              styles.replyIconLeft,
              {
                opacity: replyIconOpacity,
              },
            ]}
          >
            <Reply size={20} color="#9C6ADE" />
          </Animated.View>
        )}

        {children}

        {/* Icône de réponse à droite pour messages compagnon */}
        {!isUser && (
          <Animated.View
            style={[
              styles.replyIconRight,
              {
                opacity: replyIconOpacity,
              },
            ]}
          >
            <Reply size={20} color="#9C6ADE" />
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  swipeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyIconLeft: {
    position: 'absolute',
    right: 10,
    zIndex: -1,
  },
  replyIconRight: {
    position: 'absolute',
    left: 10,
    zIndex: -1,
  },
});
