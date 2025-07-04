import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

interface NotificationBadgeProps {
  count: number;
  size?: 'small' | 'medium' | 'large';
}

export default function NotificationBadge({ count, size = 'medium' }: NotificationBadgeProps) {
  if (count <= 0) return null;
  
  const displayCount = count > 99 ? '99+' : count.toString();
  
  return (
    <View style={[
      styles.badge, 
      size === 'small' ? styles.smallBadge : 
      size === 'large' ? styles.largeBadge : 
      styles.mediumBadge
    ]}>
      <Text style={[
        styles.text, 
        size === 'small' ? styles.smallText : 
        size === 'large' ? styles.largeText : 
        styles.mediumText
      ]}>
        {displayCount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 100, // Very high value to ensure it's always a circle
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    zIndex: 10,
  },
  smallBadge: {
    minWidth: 16,
    height: 16,
    paddingHorizontal: 2,
    top: -4,
    right: -4,
  },
  mediumBadge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    top: -6,
    right: -6,
  },
  largeBadge: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 6,
    top: -8,
    right: -8,
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
  },
  smallText: {
    fontSize: 10,
  },
  mediumText: {
    fontSize: 12,
  },
  largeText: {
    fontSize: 14,
  },
});