import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Heart, Gift, Clock, Star, MessageCircle, Mic, Video, Trophy, Target, Zap, Sparkles } from 'lucide-react-native';
import AgeVerificationModal from '@/components/AgeVerificationModal';
import { useAppState } from '@/context/AppStateContext';

export default function HomeScreen() {
  const router = useRouter();
  const { companion, verified, setVerified, isPremium } = useAppState();
  const [showAgeVerification, setShowAgeVerification] = useState(!verified);

  const handleVerification = (isVerified) => {
    setVerified(isVerified);
    setShowAgeVerification(false);
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
              />
              <View style={styles.avatarGlow} />
            </View>
            <View style={styles.companionInfo}>
              <Text style={styles.name}>{companion.name}</Text>
              <View style={styles.relationshipContainer}>
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
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/chat')}>
              <MessageCircle size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/voice')}>
              <Mic size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Voice</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/video')}>
              <Video size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Video</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/games')}>
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
            <Sparkles size={32} color="#FFD700" fill="#FFD700" />
            <View style={styles.premiumTextContainer}>
              <Text style={styles.premiumTitle}>Upgrade to Premium</Text>
              <Text style={styles.premiumDescription}>
                Unlock NSFW content, advanced personality traits, and more
              </Text>
            </View>
            <TouchableOpacity style={styles.premiumButton} onPress={() => router.push('/settings')}>
              <Text style={styles.premiumButtonText}>Upgrade</Text>
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
    padding: 20,
    borderRadius: 20,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  premiumTextContainer: {
    flex: 1,
    marginLeft: 14,
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  premiumDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    lineHeight: 20,
  },
  premiumButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  premiumButtonText: {
    color: '#9C6ADE',
    fontSize: 14,
    fontWeight: '700',
  },
});