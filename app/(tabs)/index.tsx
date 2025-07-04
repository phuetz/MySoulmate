import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Heart, Gift, Clock, Star, MessageCircle, Mic, Video } from 'lucide-react-native';
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

  const calculateRelationshipLevel = () => {
    return companion.interactions > 50 ? 'Romantic' : 
           companion.interactions > 30 ? 'Close Friend' : 
           companion.interactions > 10 ? 'Friend' : 'Acquaintance';
  };

  return (
    <View style={styles.container}>
      {showAgeVerification && (
        <AgeVerificationModal onVerify={handleVerification} />
      )}
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Image 
            source={{ uri: companion.avatarUrl }} 
            style={styles.avatar} 
          />
          <View style={styles.companionInfo}>
            <Text style={styles.name}>{companion.name}</Text>
            <View style={styles.relationshipContainer}>
              <Text style={styles.relationshipText}>
                {calculateRelationshipLevel()}
              </Text>
              <Heart size={16} color="#FF6B8A" style={styles.relationshipIcon} />
            </View>
          </View>
        </View>

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
          </View>
        </View>

        {!isPremium && (
          <View style={styles.premiumBanner}>
            <Star size={24} color="#FFD700" />
            <View style={styles.premiumTextContainer}>
              <Text style={styles.premiumTitle}>Upgrade to Premium</Text>
              <Text style={styles.premiumDescription}>
                Unlock NSFW content, advanced personality traits, and more
              </Text>
            </View>
            <TouchableOpacity style={styles.premiumButton} onPress={() => router.push('/settings')}>
              <Text style={styles.premiumButtonText}>Upgrade</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E1E1E1',
  },
  companionInfo: {
    marginLeft: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333333',
  },
  relationshipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  relationshipText: {
    fontSize: 16,
    color: '#666666',
    marginRight: 6,
  },
  relationshipIcon: {
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#777777',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  activityFeed: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activityItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  activityIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF0F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  activityTime: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
  },
  quickActions: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 6,
    backgroundColor: '#FF6B8A',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#FF6B8A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  premiumBanner: {
    backgroundColor: '#F8F2FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E0D0FF',
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  premiumTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9C6ADE',
  },
  premiumDescription: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  premiumButton: {
    backgroundColor: '#9C6ADE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  premiumButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});