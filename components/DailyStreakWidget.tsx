import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Flame, Gift, TrendingUp, Award } from 'lucide-react-native';

interface DailyStreakWidgetProps {
  currentStreak: number;
  longestStreak: number;
  nextMilestone: number;
  daysUntilMilestone: number;
  onCheckIn: () => void;
  hasCheckedInToday: boolean;
  loading?: boolean;
}

const getMilestoneReward = (milestone: number): string => {
  const rewards: { [key: number]: string } = {
    3: '50 coins + 100 XP + Badge 🏅',
    7: '150 coins + 300 XP + Badge 🔥',
    14: '300 coins + 500 XP + Badge 👑',
    30: '1,000 coins + 1,500 XP + Badge 🌟',
    100: '5,000 coins + 5,000 XP + 50% Lifetime Discount 💎',
  };
  return rewards[milestone] || `${milestone * 10} coins + ${milestone * 20} XP`;
};

export default function DailyStreakWidget({
  currentStreak,
  longestStreak,
  nextMilestone,
  daysUntilMilestone,
  onCheckIn,
  hasCheckedInToday,
  loading = false,
}: DailyStreakWidgetProps) {
  const progressPercentage = ((currentStreak % nextMilestone) / nextMilestone) * 100;

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading streak...</Text>
        </View>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#FF6B8A', '#FF8E53']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.container}
    >
      <View style={styles.header}>
        <View style={styles.flameContainer}>
          <Flame size={40} color="#FFD700" fill="#FFD700" />
        </View>
        <View style={styles.streakInfo}>
          <Text style={styles.streakNumber}>{currentStreak}</Text>
          <Text style={styles.streakLabel}>Day Streak</Text>
        </View>
        <View style={styles.recordContainer}>
          <TrendingUp size={16} color="#FFFFFF" style={styles.recordIcon} />
          <View>
            <Text style={styles.recordLabel}>Record</Text>
            <Text style={styles.recordValue}>{longestStreak} days</Text>
          </View>
        </View>
      </View>

      {!hasCheckedInToday ? (
        <TouchableOpacity
          style={styles.checkInButton}
          onPress={onCheckIn}
          accessible={true}
          accessibilityLabel="Check in for today"
          accessibilityHint="Tap to check in and maintain your daily streak"
          accessibilityRole="button"
        >
          <View style={styles.checkInContent}>
            <Text style={styles.checkInText}>Check In Now</Text>
            <Award size={20} color="#FF6B8A" style={styles.checkInIcon} />
          </View>
        </TouchableOpacity>
      ) : (
        <View style={styles.checkedInBadge}>
          <Award size={16} color="#4CAF50" fill="#4CAF50" />
          <Text style={styles.checkedInText}>Checked in today! 🎉</Text>
        </View>
      )}

      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Gift size={16} color="#FFFFFF" style={styles.giftIcon} />
          <Text style={styles.progressText}>
            {daysUntilMilestone} {daysUntilMilestone === 1 ? 'day' : 'days'} to next reward
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
        </View>
        <View style={styles.rewardPreview}>
          <Text style={styles.rewardText} numberOfLines={2}>
            {getMilestoneReward(nextMilestone)}
          </Text>
        </View>
      </View>

      {currentStreak >= 3 && (
        <View style={styles.encouragement}>
          <Text style={styles.encouragementText}>
            {currentStreak >= 30
              ? "Amazing dedication! 🌟"
              : currentStreak >= 14
              ? "You're on fire! 🔥"
              : currentStreak >= 7
              ? "Great streak! Keep it up! 💪"
              : "Looking good! 👏"}
          </Text>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#FF6B8A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  flameContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
    marginRight: 14,
  },
  streakInfo: {
    flex: 1,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 50,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  streakLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.95,
  },
  recordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  recordIcon: {
    marginRight: 6,
  },
  recordLabel: {
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.8,
    fontWeight: '500',
  },
  recordValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  checkInButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  checkInContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkInText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FF6B8A',
    marginRight: 8,
  },
  checkInIcon: {
    marginTop: 2,
  },
  checkedInBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  checkedInText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  progressSection: {
    marginTop: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  giftIcon: {
    marginRight: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.95,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  rewardPreview: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 12,
  },
  rewardText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 18,
  },
  encouragement: {
    marginTop: 12,
    alignItems: 'center',
  },
  encouragementText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    opacity: 0.9,
  },
});
