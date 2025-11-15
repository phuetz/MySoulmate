import { Animated, Easing } from 'react-native';

/**
 * Utilitaires d'animation réutilisables
 * Collection de fonctions pour des animations fluides et cohérentes
 */

/**
 * Animation de fondu entrant
 */
export const fadeIn = (
  animatedValue: Animated.Value,
  duration: number = 300,
  toValue: number = 1
): Animated.CompositeAnimation => {
  return Animated.timing(animatedValue, {
    toValue,
    duration,
    useNativeDriver: true,
    easing: Easing.out(Easing.ease),
  });
};

/**
 * Animation de fondu sortant
 */
export const fadeOut = (
  animatedValue: Animated.Value,
  duration: number = 300,
  toValue: number = 0
): Animated.CompositeAnimation => {
  return Animated.timing(animatedValue, {
    toValue,
    duration,
    useNativeDriver: true,
    easing: Easing.in(Easing.ease),
  });
};

/**
 * Animation de glissement depuis le bas
 */
export const slideInFromBottom = (
  animatedValue: Animated.Value,
  duration: number = 400,
  fromValue: number = 100
): Animated.CompositeAnimation => {
  animatedValue.setValue(fromValue);
  return Animated.spring(animatedValue, {
    toValue: 0,
    friction: 8,
    tension: 40,
    useNativeDriver: true,
  });
};

/**
 * Animation de glissement depuis le haut
 */
export const slideInFromTop = (
  animatedValue: Animated.Value,
  duration: number = 400,
  fromValue: number = -100
): Animated.CompositeAnimation => {
  animatedValue.setValue(fromValue);
  return Animated.spring(animatedValue, {
    toValue: 0,
    friction: 8,
    tension: 40,
    useNativeDriver: true,
  });
};

/**
 * Animation de glissement depuis la gauche
 */
export const slideInFromLeft = (
  animatedValue: Animated.Value,
  duration: number = 400,
  fromValue: number = -100
): Animated.CompositeAnimation => {
  animatedValue.setValue(fromValue);
  return Animated.spring(animatedValue, {
    toValue: 0,
    friction: 8,
    tension: 40,
    useNativeDriver: true,
  });
};

/**
 * Animation de glissement depuis la droite
 */
export const slideInFromRight = (
  animatedValue: Animated.Value,
  duration: number = 400,
  fromValue: number = 100
): Animated.CompositeAnimation => {
  animatedValue.setValue(fromValue);
  return Animated.spring(animatedValue, {
    toValue: 0,
    friction: 8,
    tension: 40,
    useNativeDriver: true,
  });
};

/**
 * Animation d'agrandissement (scale up)
 */
export const scaleIn = (
  animatedValue: Animated.Value,
  duration: number = 300,
  fromValue: number = 0,
  toValue: number = 1
): Animated.CompositeAnimation => {
  animatedValue.setValue(fromValue);
  return Animated.spring(animatedValue, {
    toValue,
    friction: 6,
    tension: 40,
    useNativeDriver: true,
  });
};

/**
 * Animation de rétrécissement (scale down)
 */
export const scaleOut = (
  animatedValue: Animated.Value,
  duration: number = 300,
  toValue: number = 0
): Animated.CompositeAnimation => {
  return Animated.timing(animatedValue, {
    toValue,
    duration,
    useNativeDriver: true,
    easing: Easing.in(Easing.ease),
  });
};

/**
 * Animation de rebond
 */
export const bounce = (
  animatedValue: Animated.Value,
  toValue: number = 1
): Animated.CompositeAnimation => {
  return Animated.spring(animatedValue, {
    toValue,
    friction: 3,
    tension: 40,
    useNativeDriver: true,
  });
};

/**
 * Animation de pulsation (boucle infinie)
 */
export const pulse = (
  animatedValue: Animated.Value,
  minValue: number = 0.95,
  maxValue: number = 1.05,
  duration: number = 1000
): Animated.CompositeAnimation => {
  return Animated.loop(
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: maxValue,
        duration: duration / 2,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: minValue,
        duration: duration / 2,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ])
  );
};

/**
 * Animation de rotation (boucle infinie)
 */
export const rotate = (
  animatedValue: Animated.Value,
  duration: number = 2000
): Animated.CompositeAnimation => {
  return Animated.loop(
    Animated.timing(animatedValue, {
      toValue: 1,
      duration,
      easing: Easing.linear,
      useNativeDriver: true,
    })
  );
};

/**
 * Animation de secousse (shake)
 */
export const shake = (
  animatedValue: Animated.Value,
  intensity: number = 10
): Animated.CompositeAnimation => {
  return Animated.sequence([
    Animated.timing(animatedValue, {
      toValue: intensity,
      duration: 50,
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: -intensity,
      duration: 50,
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: intensity / 2,
      duration: 50,
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: -intensity / 2,
      duration: 50,
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 50,
      useNativeDriver: true,
    }),
  ]);
};

/**
 * Animation de fondu et glissement combinés (entrée)
 */
export const fadeSlideIn = (
  opacityValue: Animated.Value,
  translateValue: Animated.Value,
  duration: number = 400,
  slideDistance: number = 50
): Animated.CompositeAnimation => {
  opacityValue.setValue(0);
  translateValue.setValue(slideDistance);

  return Animated.parallel([
    Animated.timing(opacityValue, {
      toValue: 1,
      duration,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }),
    Animated.spring(translateValue, {
      toValue: 0,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }),
  ]);
};

/**
 * Animation de fondu et glissement combinés (sortie)
 */
export const fadeSlideOut = (
  opacityValue: Animated.Value,
  translateValue: Animated.Value,
  duration: number = 300,
  slideDistance: number = 50
): Animated.CompositeAnimation => {
  return Animated.parallel([
    Animated.timing(opacityValue, {
      toValue: 0,
      duration,
      useNativeDriver: true,
      easing: Easing.in(Easing.ease),
    }),
    Animated.timing(translateValue, {
      toValue: slideDistance,
      duration,
      useNativeDriver: true,
      easing: Easing.in(Easing.ease),
    }),
  ]);
};

/**
 * Animation de fondu et agrandissement combinés
 */
export const fadeScaleIn = (
  opacityValue: Animated.Value,
  scaleValue: Animated.Value,
  duration: number = 400
): Animated.CompositeAnimation => {
  opacityValue.setValue(0);
  scaleValue.setValue(0.8);

  return Animated.parallel([
    Animated.timing(opacityValue, {
      toValue: 1,
      duration,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }),
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }),
  ]);
};

/**
 * Animation séquentielle avec délai
 */
export const staggered = (
  animations: Animated.CompositeAnimation[],
  delay: number = 100
): Animated.CompositeAnimation => {
  const staggeredAnimations = animations.map((animation, index) =>
    Animated.sequence([Animated.delay(index * delay), animation])
  );

  return Animated.parallel(staggeredAnimations);
};

/**
 * Interpolation pour la rotation
 */
export const getRotateInterpolation = (animatedValue: Animated.Value) => {
  return animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
};

/**
 * Interpolation pour l'oscillation (wiggle)
 */
export const getWiggleInterpolation = (animatedValue: Animated.Value) => {
  return animatedValue.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: ['0deg', '-5deg', '0deg', '5deg', '0deg'],
  });
};

/**
 * Configuration d'animation de ressort (spring) réutilisable
 */
export const springConfig = {
  gentle: { friction: 8, tension: 20 },
  medium: { friction: 7, tension: 40 },
  bouncy: { friction: 5, tension: 40 },
  snappy: { friction: 10, tension: 80 },
};

/**
 * Configuration d'animation de timing réutilisable
 */
export const timingConfig = {
  quick: { duration: 150, easing: Easing.out(Easing.ease) },
  normal: { duration: 300, easing: Easing.out(Easing.ease) },
  slow: { duration: 500, easing: Easing.out(Easing.ease) },
  linear: { duration: 300, easing: Easing.linear },
};

/**
 * Hook personnalisé pour animation au montage
 */
export const useEntranceAnimation = (
  type: 'fade' | 'slide' | 'scale' | 'fadeSlide' | 'fadeScale' = 'fade',
  duration: number = 400
) => {
  const opacity = new Animated.Value(0);
  const translateY = new Animated.Value(50);
  const scale = new Animated.Value(0.8);

  const animate = () => {
    switch (type) {
      case 'fade':
        fadeIn(opacity, duration).start();
        break;
      case 'slide':
        slideInFromBottom(translateY, duration).start();
        break;
      case 'scale':
        scaleIn(scale, duration).start();
        break;
      case 'fadeSlide':
        fadeSlideIn(opacity, translateY, duration).start();
        break;
      case 'fadeScale':
        fadeScaleIn(opacity, scale, duration).start();
        break;
    }
  };

  return { opacity, translateY, scale, animate };
};
