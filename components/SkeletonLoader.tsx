import React, { useEffect } from 'react';
import { StyleSheet, View, Animated } from 'react-native';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function SkeletonLoader({ width = '100%', height = 20, borderRadius = 8, style }: SkeletonLoaderProps) {
  const opacity = new Animated.Value(0.3);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function StoryCardSkeleton() {
  return (
    <View style={styles.storyCard}>
      <SkeletonLoader width="100%" height={192} borderRadius={20} style={styles.storyImage} />
      <View style={styles.storyContent}>
        <View style={styles.storyHeader}>
          <SkeletonLoader width="70%" height={24} />
          <SkeletonLoader width={40} height={20} borderRadius={10} />
        </View>
        <SkeletonLoader width="100%" height={16} style={styles.storyDesc} />
        <SkeletonLoader width="85%" height={16} />
        <View style={styles.storyMeta}>
          <SkeletonLoader width={60} height={14} />
          <SkeletonLoader width={80} height={14} />
          <SkeletonLoader width={50} height={22} borderRadius={12} />
        </View>
        <View style={styles.storyTags}>
          <SkeletonLoader width={60} height={24} borderRadius={12} style={styles.tag} />
          <SkeletonLoader width={70} height={24} borderRadius={12} style={styles.tag} />
          <SkeletonLoader width={55} height={24} borderRadius={12} />
        </View>
        <SkeletonLoader width="100%" height={44} borderRadius={22} style={styles.storyButton} />
      </View>
    </View>
  );
}

export function ActivityItemSkeleton() {
  return (
    <View style={styles.activityItem}>
      <SkeletonLoader width={44} height={44} borderRadius={22} style={styles.activityIcon} />
      <View style={styles.activityContent}>
        <SkeletonLoader width="80%" height={16} />
        <SkeletonLoader width="40%" height={14} style={styles.activityTime} />
      </View>
    </View>
  );
}

export function ChatMessageSkeleton({ isUser = false }: { isUser?: boolean }) {
  return (
    <View style={[styles.chatMessage, isUser ? styles.chatMessageUser : styles.chatMessageCompanion]}>
      {!isUser && <SkeletonLoader width={28} height={28} borderRadius={14} style={styles.chatAvatar} />}
      <View style={[styles.chatBubble, isUser ? styles.chatBubbleUser : styles.chatBubbleCompanion]}>
        <SkeletonLoader width="100%" height={16} />
        <SkeletonLoader width="70%" height={16} style={styles.chatLine} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E5E7EB',
  },
  storyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#9C6ADE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  storyImage: {
    marginBottom: 0,
  },
  storyContent: {
    padding: 16,
  },
  storyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  storyDesc: {
    marginBottom: 8,
  },
  storyMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  storyTags: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  tag: {
    marginRight: 8,
  },
  storyButton: {
    marginTop: 4,
  },
  activityItem: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  activityIcon: {
    marginRight: 14,
  },
  activityContent: {
    flex: 1,
    justifyContent: 'center',
  },
  activityTime: {
    marginTop: 6,
  },
  chatMessage: {
    marginBottom: 20,
    maxWidth: '75%',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  chatMessageUser: {
    alignSelf: 'flex-end',
  },
  chatMessageCompanion: {
    alignSelf: 'flex-start',
  },
  chatAvatar: {
    marginRight: 10,
  },
  chatBubble: {
    padding: 14,
    borderRadius: 20,
  },
  chatBubbleUser: {
    backgroundColor: '#E5E7EB',
    borderBottomRightRadius: 6,
  },
  chatBubbleCompanion: {
    backgroundColor: '#E5E7EB',
    borderBottomLeftRadius: 6,
  },
  chatLine: {
    marginTop: 8,
  },
});
