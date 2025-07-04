import React, { useState } from 'react';
import { StyleSheet, View, Text, Switch, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Lock, Bell, Shield, CreditCard, Star, CircleHelp as HelpCircle, LogOut, ChevronRight, Check } from 'lucide-react-native';
import { useAppState } from '@/context/AppStateContext';
import NotificationsPermissionPrompt from '@/components/NotificationsPermissionPrompt';
import { requestNotificationPermissions } from '@/services/notificationService';

export default function SettingsScreen() {
  const { companion, updateCompanion, isPremium, setIsPremium } = useAppState();
  const [showSubscriptionOptions, setShowSubscriptionOptions] = useState(false);
  const [showNotificationPermissionPrompt, setShowNotificationPermissionPrompt] = useState(false);
  
  const subscriptionPlans = [
    { id: 'weekly', name: 'Weekly', price: '€6.99', period: 'week' },
    { id: 'monthly', name: 'Monthly', price: '€16.99', period: 'month', popular: true },
    { id: 'yearly', name: 'Yearly', price: '€99.99', period: 'year', savings: '51% savings' },
  ];

  const toggleNotifications = async (value) => {
    if (value) {
      // If turning ON notifications, check/request permissions
      const permissionGranted = await requestNotificationPermissions();
      
      if (!permissionGranted) {
        setShowNotificationPermissionPrompt(true);
      }
    }
    
    updateCompanion({
      ...companion,
      notificationsEnabled: value
    });
  };

  const handleSubscribe = (plan) => {
    Alert.alert(
      'Subscription Simulation',
      `This would initiate a real subscription for ${plan.name} (${plan.price}/${plan.period}) in a production app.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Simulate Subscribe', 
          onPress: () => {
            setIsPremium(true);
            setShowSubscriptionOptions(false);
            Alert.alert('Success', 'Premium features have been unlocked for this demo.');
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This would delete your account and all associated data in a production app. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Account', style: 'destructive', onPress: () => {} }
      ]
    );
  };

  const handleNotificationPermissionChange = (granted: boolean) => {
    // Update the UI based on granted status if needed
    console.log('Notification permission granted:', granted);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>
      
      <ScrollView style={styles.content}>
        {!isPremium && (
          <TouchableOpacity 
            style={styles.premiumBanner}
            onPress={() => setShowSubscriptionOptions(true)}
          >
            <View style={styles.premiumBannerContent}>
              <Star size={24} color="#FFD700" />
              <View style={styles.premiumBannerText}>
                <Text style={styles.premiumBannerTitle}>Upgrade to Premium</Text>
                <Text style={styles.premiumBannerDescription}>
                  Unlock all features and remove limitations
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
        
        {showSubscriptionOptions && (
          <View style={styles.subscriptionContainer}>
            <Text style={styles.subscriptionTitle}>Choose Your Plan</Text>
            <Text style={styles.subscriptionDescription}>
              All plans include unlimited access to all premium features.
            </Text>
            
            <View style={styles.planContainer}>
              {subscriptionPlans.map((plan) => (
                <TouchableOpacity 
                  key={plan.id}
                  style={[
                    styles.planCard,
                    plan.popular && styles.popularPlan
                  ]}
                  onPress={() => handleSubscribe(plan)}
                >
                  {plan.popular && (
                    <View style={styles.popularBadge}>
                      <Text style={styles.popularBadgeText}>Most Popular</Text>
                    </View>
                  )}
                  
                  <View style={styles.planHeader}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <View style={styles.planPriceContainer}>
                      <Text style={styles.planPrice}>{plan.price}</Text>
                      <Text style={styles.planPeriod}>/{plan.period}</Text>
                    </View>
                  </View>
                  
                  {plan.savings && (
                    <Text style={styles.planSavings}>{plan.savings}</Text>
                  )}
                  
                  <TouchableOpacity 
                    style={[
                      styles.planButton,
                      plan.popular && styles.popularPlanButton
                    ]}
                    onPress={() => handleSubscribe(plan)}
                  >
                    <Text style={styles.planButtonText}>
                      Subscribe
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity 
              style={styles.cancelSubscriptionOptions}
              onPress={() => setShowSubscriptionOptions(false)}
            >
              <Text style={styles.cancelSubscriptionText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Bell size={20} color="#FF6B8A" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive messages from your companion
              </Text>
            </View>
            <Switch
              value={companion.notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: '#E1E1E1', true: '#FF6B8A' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#E1E1E1"
            />
          </View>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Lock size={20} color="#FF6B8A" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Privacy</Text>
              <Text style={styles.settingDescription}>
                Manage your data and privacy settings
              </Text>
            </View>
            <ChevronRight size={20} color="#CCCCCC" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <Shield size={20} color="#FF6B8A" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Content Filters</Text>
              <Text style={styles.settingDescription}>
                Adjust what content is allowed
              </Text>
            </View>
            <ChevronRight size={20} color="#CCCCCC" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          {isPremium && (
            <View style={styles.settingItem}>
              <View style={styles.settingIconContainer}>
                <Star size={20} color="#FFD700" />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Premium Status</Text>
                <Text style={styles.settingDescription}>
                  You have unlimited access to all features
                </Text>
              </View>
              <Check size={20} color="#4CAF50" />
            </View>
          )}
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <CreditCard size={20} color="#FF6B8A" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Payment Methods</Text>
              <Text style={styles.settingDescription}>
                Manage your payment information
              </Text>
            </View>
            <ChevronRight size={20} color="#CCCCCC" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingIconContainer}>
              <HelpCircle size={20} color="#FF6B8A" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Help & Support</Text>
              <Text style={styles.settingDescription}>
                Get assistance or report issues
              </Text>
            </View>
            <ChevronRight size={20} color="#CCCCCC" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.settingItem, styles.dangerSettingItem]}
            onPress={handleDeleteAccount}
          >
            <View style={[styles.settingIconContainer, styles.dangerIconContainer]}>
              <LogOut size={20} color="#FFFFFF" />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.dangerSettingTitle}>Delete Account</Text>
              <Text style={styles.settingDescription}>
                Permanently delete your account and data
              </Text>
            </View>
            <ChevronRight size={20} color="#CCCCCC" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.legalSection}>
          <TouchableOpacity style={styles.legalLink}>
            <Text style={styles.legalText}>Terms of Service</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.legalLink}>
            <Text style={styles.legalText}>Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.legalLink}>
            <Text style={styles.legalText}>Content Policy</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>MySoulmate v1.0.0</Text>
        </View>
      </ScrollView>
      
      <NotificationsPermissionPrompt
        visible={showNotificationPermissionPrompt}
        onClose={() => setShowNotificationPermissionPrompt(false)}
        onPermissionChange={handleNotificationPermissionChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  premiumBanner: {
    backgroundColor: '#9C6ADE',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#9C6ADE',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  premiumBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumBannerText: {
    marginLeft: 12,
  },
  premiumBannerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  premiumBannerDescription: {
    color: '#F8F0FF',
    fontSize: 12,
    marginTop: 2,
  },
  subscriptionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  subscriptionDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  planContainer: {
    marginBottom: 20,
  },
  planCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E1E1E1',
  },
  popularPlan: {
    borderColor: '#9C6ADE',
    backgroundColor: '#F9F5FF',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#9C6ADE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  planPriceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
  },
  planPeriod: {
    fontSize: 14,
    color: '#666666',
  },
  planSavings: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  planButton: {
    backgroundColor: '#FF6B8A',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  popularPlanButton: {
    backgroundColor: '#9C6ADE',
  },
  planButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelSubscriptionOptions: {
    alignItems: 'center',
    padding: 8,
  },
  cancelSubscriptionText: {
    color: '#666666',
    fontSize: 14,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF0F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dangerIconContainer: {
    backgroundColor: '#FF3B30',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  dangerSettingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FF3B30',
  },
  settingDescription: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  dangerSettingItem: {
    borderBottomWidth: 0,
  },
  legalSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  legalLink: {
    paddingVertical: 8,
  },
  legalText: {
    color: '#666666',
    fontSize: 12,
  },
  versionContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  versionText: {
    color: '#999999',
    fontSize: 12,
  },
});