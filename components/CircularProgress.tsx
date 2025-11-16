import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CircularProgressProps {
  percentage: number;
  radius?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  duration?: number;
  showPercentage?: boolean;
  children?: React.ReactNode;
}

export default function CircularProgress({
  percentage,
  radius = 40,
  strokeWidth = 6,
  color = '#FF6B8A',
  backgroundColor = '#E5E7EB',
  duration = 1000,
  showPercentage = true,
  children,
}: CircularProgressProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const circleRef = useRef<any>(null);

  const circumference = 2 * Math.PI * radius;
  const size = (radius + strokeWidth) * 2;
  const center = size / 2;

  useEffect(() => {
    animatedValue.setValue(0);
    Animated.timing(animatedValue, {
      toValue: percentage,
      duration,
      useNativeDriver: true,
    }).start();
  }, [percentage]);

  useEffect(() => {
    animatedValue.addListener((v) => {
      if (circleRef.current) {
        const strokeDashoffset = circumference - (circumference * v.value) / 100;
        circleRef.current.setNativeProps({
          strokeDashoffset,
        });
      }
    });

    return () => {
      animatedValue.removeAllListeners();
    };
  }, []);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <AnimatedCircle
          ref={circleRef}
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      <View style={styles.content}>
        {children || (
          showPercentage && (
            <Text style={[styles.percentage, { color }]}>
              {Math.round(percentage)}%
            </Text>
          )
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentage: {
    fontSize: 18,
    fontWeight: '700',
  },
});
