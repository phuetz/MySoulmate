import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import {
  fadeIn,
  fadeOut,
  scaleIn,
  scaleOut,
  slideInFromBottom,
  pulse,
  shake,
  fadeSlideIn,
} from '@/utils/animations';

/**
 * Hooks personnalisés pour animations réutilisables
 */

/**
 * Hook pour animation de fondu au montage
 */
export const useFadeIn = (duration: number = 300, autoStart: boolean = true) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (autoStart) {
      fadeIn(opacity, duration).start();
    }
  }, [autoStart, opacity, duration]);

  return {
    opacity,
    start: () => fadeIn(opacity, duration).start(),
    reset: () => opacity.setValue(0),
  };
};

/**
 * Hook pour animation d'agrandissement au montage
 */
export const useScaleIn = (duration: number = 300, autoStart: boolean = true) => {
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (autoStart) {
      scaleIn(scale, duration).start();
    }
  }, [autoStart, scale, duration]);

  return {
    scale,
    start: () => scaleIn(scale, duration).start(),
    reset: () => scale.setValue(0),
  };
};

/**
 * Hook pour animation de glissement depuis le bas
 */
export const useSlideInFromBottom = (
  distance: number = 100,
  autoStart: boolean = true
) => {
  const translateY = useRef(new Animated.Value(distance)).current;

  useEffect(() => {
    if (autoStart) {
      slideInFromBottom(translateY).start();
    }
  }, [autoStart, translateY]);

  return {
    translateY,
    start: () => slideInFromBottom(translateY).start(),
    reset: () => translateY.setValue(distance),
  };
};

/**
 * Hook pour animation combinée fondu + glissement
 */
export const useFadeSlideIn = (
  duration: number = 400,
  slideDistance: number = 50,
  autoStart: boolean = true
) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(slideDistance)).current;

  useEffect(() => {
    if (autoStart) {
      fadeSlideIn(opacity, translateY, duration, slideDistance).start();
    }
  }, [autoStart, opacity, translateY, duration, slideDistance]);

  return {
    opacity,
    translateY,
    start: () => fadeSlideIn(opacity, translateY, duration, slideDistance).start(),
    reset: () => {
      opacity.setValue(0);
      translateY.setValue(slideDistance);
    },
  };
};

/**
 * Hook pour animation de pulsation continue
 */
export const usePulse = (
  minValue: number = 0.95,
  maxValue: number = 1.05,
  duration: number = 1000,
  autoStart: boolean = true
) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (autoStart) {
      const animation = pulse(scale, minValue, maxValue, duration);
      animation.start();
      return () => animation.stop();
    }
  }, [autoStart, scale, minValue, maxValue, duration]);

  return {
    scale,
    start: () => pulse(scale, minValue, maxValue, duration).start(),
    stop: () => scale.stopAnimation(),
  };
};

/**
 * Hook pour animation de secousse (shake)
 */
export const useShake = (intensity: number = 10) => {
  const translateX = useRef(new Animated.Value(0)).current;

  const trigger = () => {
    shake(translateX, intensity).start();
  };

  return {
    translateX,
    trigger,
  };
};

/**
 * Hook pour gérer les transitions entre états (visible/invisible)
 */
export const useToggleAnimation = (
  initialValue: boolean = false,
  duration: number = 300
) => {
  const opacity = useRef(new Animated.Value(initialValue ? 1 : 0)).current;
  const scale = useRef(new Animated.Value(initialValue ? 1 : 0)).current;

  const show = () => {
    Animated.parallel([
      fadeIn(opacity, duration),
      scaleIn(scale, duration),
    ]).start();
  };

  const hide = () => {
    Animated.parallel([
      fadeOut(opacity, duration),
      scaleOut(scale, duration),
    ]).start();
  };

  const toggle = (visible: boolean) => {
    if (visible) {
      show();
    } else {
      hide();
    }
  };

  return {
    opacity,
    scale,
    show,
    hide,
    toggle,
  };
};

/**
 * Hook pour animations de liste (staggered)
 */
export const useStaggeredAnimation = (
  itemCount: number,
  delay: number = 100,
  duration: number = 300
) => {
  const animatedValues = useRef(
    Array.from({ length: itemCount }, () => new Animated.Value(0))
  ).current;

  const startStaggered = () => {
    const animations = animatedValues.map((value, index) =>
      Animated.sequence([
        Animated.delay(index * delay),
        fadeIn(value, duration),
      ])
    );
    Animated.parallel(animations).start();
  };

  const reset = () => {
    animatedValues.forEach((value) => value.setValue(0));
  };

  return {
    animatedValues,
    startStaggered,
    reset,
  };
};

/**
 * Hook pour animation de progression (progress bar)
 */
export const useProgress = (targetValue: number, duration: number = 1000) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: targetValue,
      duration,
      useNativeDriver: true,
    }).start();
  }, [targetValue, progress, duration]);

  return progress;
};

/**
 * Hook pour animation au clic/tap
 */
export const useTapAnimation = (
  scaleDown: number = 0.95,
  duration: number = 100
) => {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: scaleDown,
      useNativeDriver: true,
      friction: 3,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 3,
    }).start();
  };

  return {
    scale,
    onPressIn,
    onPressOut,
  };
};

/**
 * Hook pour animation de chargement (spinner)
 */
export const useRotationAnimation = (duration: number = 1000, autoStart: boolean = true) => {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (autoStart) {
      const animation = Animated.loop(
        Animated.timing(rotation, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        })
      );
      animation.start();
      return () => animation.stop();
    }
  }, [autoStart, rotation, duration]);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return {
    rotate,
  };
};
