/**
 * Skeleton Loader Components
 * Provides loading placeholders for better UX
 */
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Base Skeleton component with shimmer animation
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true
        })
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7]
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity
        },
        style
      ]}
    />
  );
};

/**
 * Skeleton for text lines
 */
export const SkeletonText: React.FC<{
  lines?: number;
  lastLineWidth?: string;
  spacing?: number;
}> = ({ lines = 3, lastLineWidth = '60%', spacing = 8 }) => {
  return (
    <View>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? lastLineWidth : '100%'}
          height={16}
          style={{ marginBottom: index < lines - 1 ? spacing : 0 }}
        />
      ))}
    </View>
  );
};

/**
 * Skeleton for circular avatars
 */
export const SkeletonAvatar: React.FC<{
  size?: number;
}> = ({ size = 50 }) => {
  return (
    <Skeleton
      width={size}
      height={size}
      borderRadius={size / 2}
    />
  );
};

/**
 * Skeleton for cards
 */
export const SkeletonCard: React.FC = () => {
  return (
    <View style={styles.card}>
      <Skeleton width="100%" height={200} borderRadius={8} />
      <View style={styles.cardContent}>
        <SkeletonText lines={2} lastLineWidth="70%" />
        <View style={{ height: 12 }} />
        <View style={styles.cardFooter}>
          <SkeletonAvatar size={32} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Skeleton width="60%" height={12} />
          </View>
        </View>
      </View>
    </View>
  );
};

/**
 * Skeleton for chat messages
 */
export const SkeletonChatMessage: React.FC<{
  isMe?: boolean;
}> = ({ isMe = false }) => {
  return (
    <View
      style={[
        styles.chatMessage,
        isMe ? styles.chatMessageRight : styles.chatMessageLeft
      ]}
    >
      {!isMe && <SkeletonAvatar size={32} />}
      <View style={styles.chatBubble}>
        <SkeletonText lines={2} lastLineWidth="80%" spacing={4} />
      </View>
      {isMe && <SkeletonAvatar size={32} />}
    </View>
  );
};

/**
 * Skeleton for list items
 */
export const SkeletonListItem: React.FC = () => {
  return (
    <View style={styles.listItem}>
      <SkeletonAvatar size={50} />
      <View style={styles.listItemContent}>
        <Skeleton width="70%" height={16} style={{ marginBottom: 8 }} />
        <Skeleton width="90%" height={12} />
      </View>
    </View>
  );
};

/**
 * Skeleton for product grid
 */
export const SkeletonProductGrid: React.FC<{
  columns?: number;
  rows?: number;
}> = ({ columns = 2, rows = 3 }) => {
  const items = Array.from({ length: columns * rows });

  return (
    <View style={styles.grid}>
      {items.map((_, index) => (
        <View key={index} style={[styles.gridItem, { width: `${100 / columns - 2}%` }]}>
          <Skeleton width="100%" height={150} borderRadius={8} />
          <View style={{ marginTop: 8 }}>
            <Skeleton width="100%" height={14} style={{ marginBottom: 4 }} />
            <Skeleton width="60%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
};

/**
 * Skeleton for profile header
 */
export const SkeletonProfileHeader: React.FC = () => {
  return (
    <View style={styles.profileHeader}>
      <SkeletonAvatar size={100} />
      <View style={styles.profileInfo}>
        <Skeleton width="60%" height={24} style={{ marginBottom: 8 }} />
        <Skeleton width="80%" height={16} style={{ marginBottom: 8 }} />
        <View style={styles.profileStats}>
          <Skeleton width={80} height={40} borderRadius={8} />
          <Skeleton width={80} height={40} borderRadius={8} />
          <Skeleton width={80} height={40} borderRadius={8} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E0E0E0',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden'
  },
  cardContent: {
    padding: 16
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  chatMessage: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end'
  },
  chatMessageLeft: {
    justifyContent: 'flex-start'
  },
  chatMessageRight: {
    justifyContent: 'flex-end'
  },
  chatBubble: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 8,
    maxWidth: '70%'
  },
  listItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFF',
    marginBottom: 1
  },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center'
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  gridItem: {
    marginBottom: 16
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20
  },
  profileInfo: {
    alignItems: 'center',
    marginTop: 16,
    width: '100%'
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 16,
    gap: 12
  }
});
