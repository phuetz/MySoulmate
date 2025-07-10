import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, FlatList, Alert, Switch, ActivityIndicator, Image } from 'react-native';
import { Send, Search, Filter, Edit, Trash2 } from 'lucide-react-native';
import { useAppState } from '@/context/AppStateContext';
import { Notification } from '@/components/NotificationItem';

export default function AdminNotificationsScreen() {
  const { companion } = useAppState();
  const [isCreating, setIsCreating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<'all' | 'premium' | 'free' | 'inactive'>('all');
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    imageUrl: '',
    isScheduled: false,
    scheduledDate: '',
    isPush: true,
    isEmail: false
  });
  
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'system',
      title: 'New Feature Announcement',
      message: 'We\'ve added new premium voice features. Check them out today!',
      imageUrl: 'https://images.pexels.com/photos/556669/pexels-photo-556669.jpeg?auto=compress&cs=tinysrgb&w=600',
      time: '3 days ago',
      read: true,
      actionRoute: '/voice'
    },
    {
      id: '2',
      type: 'system',
      title: 'Premium Subscription Promotion',
      message: '50% off on yearly subscriptions for the next 48 hours.',
      imageUrl: 'https://images.pexels.com/photos/2523959/pexels-photo-2523959.jpeg?auto=compress&cs=tinysrgb&w=600',
      time: '1 week ago',
      read: true,
      actionRoute: '/settings'
    },
    {
      id: '3',
      type: 'system',
      title: 'System Maintenance',
      message: 'The app will be down for maintenance on Sunday from 2-4am UTC.',
      imageUrl: 'https://images.pexels.com/photos/159298/tools-screwdriver-screws-nuts-bolts-159298.jpeg?auto=compress&cs=tinysrgb&w=600',
      time: '2 weeks ago',
      read: true
    },
    {
      id: '4',
      type: 'system',
      title: 'Welcome to My Soulmate',
      message: 'Welcome to My Soulmate! Discover all our features to connect with your AI companion.',
      imageUrl: 'https://images.pexels.com/photos/1907227/pexels-photo-1907227.jpeg?auto=compress&cs=tinysrgb&w=600',
      time: '1 month ago',
      read: true
    }
  ]);
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            setNotifications(notifications.filter(n => n.id !== id));
          }
        }
      ]
    );
  };

  const handleEdit = (notification: Notification) => {
    setNewNotification({
      title: notification.title,
      message: notification.message,
      isScheduled: false,
      scheduledDate: '',
      isPush: true,
      isEmail: false
    });
    setIsCreating(true);
  };

  const handleSendNotification = () => {
    if (!newNotification.title.trim() || !newNotification.message.trim()) {
      Alert.alert('Error', 'Title and message are required');
      return;
    }

    setIsSending(true);
    
    // Simulate API call delay
    setTimeout(() => {
      // Add to notifications list
      const newSystemNotification: Notification = {
        id: Date.now().toString(),
        type: 'system',
        title: newNotification.title,
        message: newNotification.message,
        imageUrl: newNotification.imageUrl || undefined,
        time: 'Just now',
        read: false
      };
      
      setNotifications([newSystemNotification, ...notifications]);
      
      // Show success message
      let userCount = 0;
      switch (selectedUsers) {
        case 'premium':
          userCount = 87;
          break;
        case 'free':
          userCount = 45;
          break;
        case 'inactive':
          userCount = 23;
          break;
        default:
          userCount = 155;
      }
      
      const deliveryMethod = 
        newNotification.isPush && newNotification.isEmail ? 'push notifications and emails' :
        newNotification.isPush ? 'push notifications' : 'emails';
      
      Alert.alert(
        'Success',
        `Notification "${newNotification.title}" has been sent to ${userCount} users via ${deliveryMethod}.`
      );
      
      // Reset form
      setNewNotification({
        title: '',
        message: '',
        imageUrl: '',
        isScheduled: false,
        scheduledDate: '',
        isPush: true,
        isEmail: false
      });
      setIsCreating(false);
      setIsSending(false);
    }, 1500);
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <View style={styles.notificationItem}>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        {item.imageUrl && (
          <Image source={{ uri: item.imageUrl }} style={styles.notificationImage} />
        )}
        <Text style={styles.notificationTime}>{item.time}</Text>
      </View>
      
      <View style={styles.notificationActions}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => handleEdit(item)}
        >
          <Edit size={16} color="#4CAF50" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleDelete(item.id)}
        >
          <Trash2 size={16} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {!isCreating ? (
        <>
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Search size={18} color="#999999" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search notifications..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            
            <TouchableOpacity style={styles.filterButton}>
              <Filter size={18} color="#666666" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setIsCreating(true)}
            >
              <Send size={18} color="#FFFFFF" />
              <Text style={styles.addButtonText}>New</Text>
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF6B8A" />
              <Text style={styles.loadingText}>Loading notifications...</Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              renderItem={renderNotificationItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.notificationList}
              onRefresh={handleRefresh}
              refreshing={refreshing}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No notifications found</Text>
                </View>
              }
            />
          )}
        </>
      ) : (
        <View style={styles.createContainer}>
          <View style={styles.createHeader}>
            <Text style={styles.createTitle}>Create Notification</Text>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setIsCreating(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.formContainer}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                value={newNotification.title}
                onChangeText={(text) => setNewNotification({...newNotification, title: text})}
                placeholder="Enter notification title"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Message</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newNotification.message}
                onChangeText={(text) => setNewNotification({...newNotification, message: text})}
                placeholder="Enter notification message"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Image URL (optional)</Text>
              <TextInput
                style={styles.input}
                value={newNotification.imageUrl}
                onChangeText={(text) => setNewNotification({...newNotification, imageUrl: text})}
                placeholder="https://example.com/image.jpg"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Recipients</Text>
              <View style={styles.segmentedControl}>
                <TouchableOpacity
                  style={[
                    styles.segment,
                    selectedUsers === 'all' && styles.activeSegment,
                    { borderTopLeftRadius: 8, borderBottomLeftRadius: 8 }
                  ]}
                  onPress={() => setSelectedUsers('all')}
                >
                  <Text style={[
                    styles.segmentText,
                    selectedUsers === 'all' && styles.activeSegmentText
                  ]}>All Users</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.segment,
                    selectedUsers === 'premium' && styles.activeSegment
                  ]}
                  onPress={() => setSelectedUsers('premium')}
                >
                  <Text style={[
                    styles.segmentText,
                    selectedUsers === 'premium' && styles.activeSegmentText
                  ]}>Premium</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.segment,
                    selectedUsers === 'free' && styles.activeSegment
                  ]}
                  onPress={() => setSelectedUsers('free')}
                >
                  <Text style={[
                    styles.segmentText,
                    selectedUsers === 'free' && styles.activeSegmentText
                  ]}>Free</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.segment,
                    selectedUsers === 'inactive' && styles.activeSegment,
                    { borderTopRightRadius: 8, borderBottomRightRadius: 8 }
                  ]}
                  onPress={() => setSelectedUsers('inactive')}
                >
                  <Text style={[
                    styles.segmentText,
                    selectedUsers === 'inactive' && styles.activeSegmentText
                  ]}>Inactive</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <View style={styles.switchContainer}>
                <Text style={styles.switchLabel}>Schedule for later</Text>
                <Switch
                  value={newNotification.isScheduled}
                  onValueChange={(value) => setNewNotification({...newNotification, isScheduled: value})}
                  trackColor={{ false: '#E1E1E1', true: '#FF6B8A' }}
                  thumbColor="#FFFFFF"
                />
              </View>
              
              {newNotification.isScheduled && (
                <TextInput
                  style={[styles.input, styles.dateInput]}
                  value={newNotification.scheduledDate}
                  onChangeText={(text) => setNewNotification({...newNotification, scheduledDate: text})}
                  placeholder="YYYY-MM-DD HH:MM"
                />
              )}
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Delivery Method</Text>
              
              <View style={styles.checkboxContainer}>
                <View style={styles.checkbox}>
                  <Switch
                    value={newNotification.isPush}
                    onValueChange={(value) => setNewNotification({...newNotification, isPush: value})}
                    trackColor={{ false: '#E1E1E1', true: '#FF6B8A' }}
                    thumbColor="#FFFFFF"
                  />
                  <Text style={styles.checkboxLabel}>Push Notification</Text>
                </View>
                
                <View style={styles.checkbox}>
                  <Switch
                    value={newNotification.isEmail}
                    onValueChange={(value) => setNewNotification({...newNotification, isEmail: value})}
                    trackColor={{ false: '#E1E1E1', true: '#FF6B8A' }}
                    thumbColor="#FFFFFF"
                  />
                  <Text style={styles.checkboxLabel}>Email</Text>
                </View>
              </View>
            </View>
            
            <TouchableOpacity 
              style={[styles.sendButton, isSending && styles.sendingButton]}
              onPress={handleSendNotification}
              disabled={isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Send size={16} color="#FFFFFF" />
                  <Text style={styles.sendButtonText}>
                    {newNotification.isScheduled ? 'Schedule Notification' : 'Send Notification'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: '#333333',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B8A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666666',
  },
  notificationList: {
    padding: 16,
    paddingTop: 8,
  },
  notificationItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
    lineHeight: 20,
  },
  notificationImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999999',
  },
  notificationActions: {
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999999',
    textAlign: 'center',
  },
  createContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  createHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  createTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  cancelButton: {
    padding: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#666666',
  },
  formContainer: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E1E1E1',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateInput: {
    marginTop: 8,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 8,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  activeSegment: {
    backgroundColor: '#FF6B8A',
  },
  segmentText: {
    fontSize: 12,
    color: '#666666',
  },
  activeSegmentText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  checkboxContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    marginBottom: 8,
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333333',
    marginLeft: 8,
  },
  sendButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF6B8A',
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 16,
  },
  sendingButton: {
    opacity: 0.7,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});