import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Heart, Gift, Clock, Star, MessageCircle, Mic, Video, Trophy, Target, Zap, Sparkles } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AgeVerificationModal from '@/components/AgeVerificationModal';
import DailyStreakWidget from '@/components/DailyStreakWidget';
import { useAppState } from '@/context/AppStateContext';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastCheckIn: string | null;
  nextMilestone: number;
  hasCheckedInToday: boolean;
}

export default function HomeScreen() {
  const router = useRouter();
  const { companion, verified, setVerified, isPremium } = useAppState();
  const [showAgeVerification, setShowAgeVerification] = useState(!verified);
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [loadingStreak, setLoadingStreak] = useState(true);

  const handleVerification = (isVerified) => {
    setVerified(isVerified);
    setShowAgeVerification(false);
  };

  useEffect(() => {
    loadStreakData();
  }, []);

  const loadStreakData = async () => {
    try {
      setLoadingStreak(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        setLoadingStreak(false);
        return;
      }

      const response = await fetch('http://localhost:3000/api/v1/streaks/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success && data.streak) {
        const streak = data.streak;
        const today = new Date().toISOString().split('T')[0];
        const lastCheckInDate = streak.lastCheckIn ? new Date(streak.lastCheckIn).toISOString().split('T')[0] : null;
        const hasCheckedInToday = lastCheckInDate === today;

        // Calculate next milestone
        const milestones = [3, 7, 14, 30, 100];
        const nextMilestone = milestones.find(m => m > streak.currentStreak) || 100;
        const daysUntilMilestone = nextMilestone - (streak.currentStreak % nextMilestone);

        setStreakData({
          currentStreak: streak.currentStreak || 0,
          longestStreak: streak.longestStreak || 0,
          lastCheckIn: streak.lastCheckIn,
          nextMilestone,
          hasCheckedInToday,
        });
      }
    } catch (error) {
      console.error('Error loading streak data:', error);
    } finally {
      setLoadingStreak(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Please log in to check in');
        return;
      }

      const response = await fetch('http://localhost:3000/api/v1/streaks/check-in', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert(
          'Check-in Successful! 🎉',
          `Streak: ${data.streak.currentStreak} days\nReward: ${data.reward.coins} coins + ${data.reward.xp} XP`,
          [{ text: 'Awesome!', onPress: () => loadStreakData() }]
        );
      } else {
        Alert.alert('Error', data.message || 'Failed to check in');
      }
    } catch (error) {
      console.error('Error checking in:', error);
      Alert.alert('Error', 'Failed to check in. Please try again.');
    }
  };


  return (
    <View style={styles.container}>
      {showAgeVerification && (
        <AgeVerificationModal onVerify={handleVerification} />
      )}

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <LinearGradient
          colors={['#FF6B8A', '#9C6ADE']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: companion.avatarUrl }}
                style={styles.avatar}
                accessible={true}
                accessibilityLabel={`${companion.name}'s avatar`}
                accessibilityRole="image"
              />
              <View style={styles.avatarGlow} accessible={false} />
            </View>
            <View style={styles.companionInfo}>
              <Text
                style={styles.name}
                accessible={true}
                accessibilityLabel={`Companion name: ${companion.name}`}
                accessibilityRole="text"
              >
                {companion.name}
              </Text>
              <View
                style={styles.relationshipContainer}
                accessible={true}
                accessibilityLabel={`Relationship status: ${companion.relationshipStatus}`}
                accessibilityRole="text"
              >
                <Heart size={18} color="#FFFFFF" fill="#FFFFFF" style={styles.relationshipIcon} />
                <Text style={styles.relationshipText}>
                  {companion.relationshipStatus}
                </Text>
              </View>
            </View>
            <View style={styles.premiumBadge}>
              {isPremium && (
                <View style={styles.premiumIconContainer}>
                  <Star size={16} color="#FFD700" fill="#FFD700" />
                </View>
              )}
            </View>
          </View>
        </LinearGradient>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Clock size={24} color="#9C6ADE" />
            <Text style={styles.statValue}>{companion.days} days</Text>
            <Text style={styles.statLabel}>Together</Text>
          </View>
          <View style={styles.statItem}>
            <MessageCircle size={24} color="#9C6ADE" />
            <Text style={styles.statValue}>{companion.messages}</Text>
            <Text style={styles.statLabel}>Messages</Text>
          </View>
          <View style={styles.statItem}>
            <Gift size={24} color="#9C6ADE" />
            <Text style={styles.statValue}>{companion.gifts}</Text>
            <Text style={styles.statLabel}>Gifts</Text>
          </View>
          <View style={styles.statItem}>
            <Trophy size={24} color="#9C6ADE" />
            <Text style={styles.statValue}>Lv.{companion.level || 1}</Text>
            <Text style={styles.statLabel}>Level</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Level Progress</Text>
            <Text style={styles.xpText}>{companion.xp || 0} XP</Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${((companion.xp || 0) % 100)}%` }
              ]}
            />
          </View>
          <Text style={styles.progressSubtext}>
            {100 - ((companion.xp || 0) % 100)} XP to level {(companion.level || 1) + 1}
          </Text>
        </View>

        {streakData && (
          <DailyStreakWidget
            currentStreak={streakData.currentStreak}
            longestStreak={streakData.longestStreak}
            nextMilestone={streakData.nextMilestone}
            daysUntilMilestone={streakData.nextMilestone - (streakData.currentStreak % streakData.nextMilestone)}
            onCheckIn={handleCheckIn}
            hasCheckedInToday={streakData.hasCheckedInToday}
            loading={loadingStreak}
          />
        )}

        <View style={styles.activityFeed}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {companion.recentActivities.map((activity, index) => (
            <View key={index} style={styles.activityItem}>
              <View style={styles.activityIconContainer}>
                {activity.type === 'message' && <MessageCircle size={20} color="#FF6B8A" />}
                {activity.type === 'gift' && <Gift size={20} color="#FF6B8A" />}
                {activity.type === 'voice' && <Mic size={20} color="#FF6B8A" />}
                {activity.type === 'video' && <Video size={20} color="#FF6B8A" />}
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>{activity.description}</Text>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/chat')}
              accessible={true}
              accessibilityLabel="Start chat"
              accessibilityHint="Opens the chat screen to message your AI companion"
              accessibilityRole="button"
            >
              <MessageCircle size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/voice')}
              accessible={true}
              accessibilityLabel="Start voice call"
              accessibilityHint="Opens the voice call screen to talk with your companion"
              accessibilityRole="button"
            >
              <Mic size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Voice</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/video')}
              accessible={true}
              accessibilityLabel="Start video call"
              accessibilityHint="Opens the video call screen"
              accessibilityRole="button"
            >
              <Video size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Video</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/games')}
              accessible={true}
              accessibilityLabel="Play games"
              accessibilityHint="Opens the games screen to play mini-games"
              accessibilityRole="button"
            >
              <Target size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Games</Text>
            </TouchableOpacity>
          </View>
        </View>

        {!isPremium && (
          <LinearGradient
            colors={['#9C6ADE', '#6B5FF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.premiumBanner}
          >
            <View style={styles.premiumContent}>
              <View style={styles.premiumBadge}>
                <Star size={16} color="#FFD700" fill="#FFD700" />
                <Text style={styles.premiumBadgeText}>7-DAY FREE TRIAL</Text>
              </View>
              <View style={styles.premiumHeader}>
                <Sparkles size={28} color="#FFD700" fill="#FFD700" style={styles.premiumIcon} />
                <Text style={styles.premiumTitle}>Try Premium Free</Text>
              </View>
              <Text style={styles.premiumSubtitle}>
                Join 10,000+ users • From $7.99/month
              </Text>
              <View style={styles.premiumFeatures}>
                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>✓</Text>
                  <Text style={styles.featureText}>Unlimited stories</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>✓</Text>
                  <Text style={styles.featureText}>NSFW mode</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>✓</Text>
                  <Text style={styles.featureText}>5 AI images/month</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={styles.premiumButton}
              onPress={() => router.push('/settings')}
              accessible={true}
              accessibilityLabel="Start 7-day free trial"
              accessibilityHint="Tap to upgrade to premium and start your free trial"
              accessibilityRole="button"
            >
              <Text style={styles.premiumButtonText}>Start Free Trial →</Text>
            </TouchableOpacity>
          </LinearGradient>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  headerGradient: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 32,
    marginBottom: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    backgroundColor: '#E1E1E1',
  },
  avatarGlow: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFFFFF',
    opacity: 0.3,
    top: 0,
    left: 0,
  },
  companionInfo: {
    flex: 1,
    marginLeft: 20,
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  relationshipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  relationshipText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 6,
  },
  relationshipIcon: {
    marginRight: 2,
  },
  premiumBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  premiumIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 20,
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 12,
    color: '#999999',
    marginTop: 6,
    fontWeight: '500',
  },
  progressContainer: {
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
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
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
  progressSubtext: {
    fontSize: 13,
    color: '#666666',
    textAlign: 'center',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  activityFeed: {
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
  activityItem: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  activityIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF0F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  activityContent: {
    flex: 1,
    justifyContent: 'center',
  },
  activityText: {
    fontSize: 15,
    color: '#333333',
    lineHeight: 22,
    fontWeight: '500',
  },
  activityTime: {
    fontSize: 13,
    color: '#999999',
    marginTop: 4,
  },
  quickActions: {
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FF6B8A',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
  },
  premiumBanner: {
    marginHorizontal: 20,
    padding: 24,
    borderRadius: 24,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#9C6ADE',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  premiumContent: {
    marginBottom: 16,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  premiumBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFD700',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  premiumIcon: {
    marginRight: 10,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  premiumSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 16,
    fontWeight: '500',
  },
  premiumFeatures: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
    marginRight: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    opacity: 0.95,
  },
  premiumButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  premiumButtonText: {
    color: '#9C6ADE',
    fontSize: 16,
    fontWeight: '800',
  },
});