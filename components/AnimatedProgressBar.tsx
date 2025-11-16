import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated } from 'react-native';

interface AnimatedProgressBarProps {
  currentXP: number;
  level: number;
  maxXP?: number;
}

export default function AnimatedProgressBar({ currentXP, level, maxXP = 100 }: AnimatedProgressBarProps) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const xpAnim = useRef(new Animated.Value(currentXP)).current;

  const xpInCurrentLevel = currentXP % maxXP;
  const xpToNextLevel = maxXP - xpInCurrentLevel;
  const progressPercentage = (xpInCurrentLevel / maxXP) * 100;

  useEffect(() => {
    // Animate progress bar
    Animated.spring(progressAnim, {
      toValue: progressPercentage,
      useNativeDriver: false,
      tension: 40,
      friction: 7,
    }).start();

    // Animate XP number
    Animated.timing(xpAnim, {
      toValue: currentXP,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [currentXP, progressPercentage]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Level Progress</Text>
        <Animated.Text style={styles.xpText}>
          {currentXP} XP
        </Animated.Text>
      </View>
      <View style={styles.progressBar}>
        <Animated.View
          style={[
            styles.progressFill,
            { width: progressWidth }
          ]}
        />
      </View>
      <Text style={styles.subtext}>
        {xpToNextLevel} XP to level {level + 1}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: '#9C6ADE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
  },
  xpText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#9C6ADE',
  },
  progressBar: {
    height: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B8A',
    borderRadius: 10,
  },
  subtext: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
    fontWeight: '500',
  },
});
