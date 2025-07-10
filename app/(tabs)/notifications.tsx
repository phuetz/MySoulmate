import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Bell, BellOff, Check, Trash2 } from 'lucide-react-native';
import { useAppState } from '@/context/AppStateContext';
import NotificationItem, { Notification } from '@/components/NotificationItem';
import {
  requestNotificationPermissions,
  generateScheduledNotifications,
  schedulePersonalizedNotifications,
  scheduleDailyNotification,
} from '@/services/notificationService';

export default function NotificationsScreen() {
  const { companion, updateCompanion } = useAppState();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    companion?.notificationsEnabled ?? true,
  );

  useEffect(() => {
    const checkPermissions = async () => {
      const granted = await requestNotificationPermissions();
      setPermissionGranted(granted);
      setLoading(false);
    };

    checkPermissions();

    // Get initial notifications
    const initialNotifications = generateScheduledNotifications(companion);
    setNotifications(initialNotifications);

    // Schedule future notifications if enabled
    if (notificationsEnabled) {
      schedulePersonalizedNotifications(companion, { notificationsEnabled });
      scheduleDailyNotification(
        `${companion.name} Daily Check-in`,
        `Come back and talk with ${companion.name}!`,
        9,
        0,
        { route: '/chat' },
      );
    }
  }, []);

  const handleToggleNotifications = (value: boolean) => {
    setNotificationsEnabled(value);

    // Update companion preferences
    updateCompanion({
      ...companion,
      notificationsEnabled: value,
    });

    // If enabling notifications, request permissions if needed
    if (value && !permissionGranted) {
      requestNotificationPermissions().then((granted) => {
        setPermissionGranted(granted);
        if (!granted) {
          Alert.alert(
            'Permission Required',
            'To receive notifications, please enable notification permissions in your device settings.',
            [{ text: 'OK' }],
          );
        }
      });
    }

    // Schedule or cancel future notifications
    if (value) {
      schedulePersonalizedNotifications(companion, {
        notificationsEnabled: value,
      });
      scheduleDailyNotification(
        `${companion.name} Daily Check-in`,
        `Come back and talk with ${companion.name}!`,
        9,
        0,
        { route: '/chat' },
      );
    }
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification,
      ),
    );
  };

  const clearAllNotifications = () => {
    Alert.alert(
      'Clear Notifications',
      'Are you sure you want to clear all notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => setNotifications([]),
        },
      ],
    );
  };

  const getUnreadCount = () => {
    return notifications.filter((notification) => !notification.read).length;
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, read: true })),
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      <View style={styles.preferencesContainer}>
        <View style={styles.preferenceItem}>
          <View style={styles.preferenceTextContainer}>
            <Text style={styles.preferenceTitle}>Push Notifications</Text>
            <Text style={styles.preferenceDescription}>
              Receive alerts when your companion has updates
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{ false: '#E1E1E1', true: '#FF6B8A' }}
            thumbColor="#FFFFFF"
            ios_backgroundColor="#E1E1E1"
          />
        </View>
      </View>

      {notifications.length > 0 ? (
        <>
          <View style={styles.actionsContainer}>
            <Text style={styles.notificationCount}>
              {getUnreadCount()} unread{' '}
              {getUnreadCount() === 1 ? 'notification' : 'notifications'}
            </Text>
            <View style={styles.actionButtons}>
              {getUnreadCount() > 0 && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={markAllAsRead}
                >
                  <Check size={16} color="#333333" />
                  <Text style={styles.actionButtonText}>Mark all read</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.actionButton, styles.clearButton]}
                onPress={clearAllNotifications}
              >
                <Trash2 size={16} color="#FF3B30" />
                <Text style={[styles.actionButtonText, styles.clearButtonText]}>
                  Clear all
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            data={notifications}
            renderItem={({ item }) => (
              <NotificationItem notification={item} onRead={markAsRead} />
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.notificationsList}
          />
        </>
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Bell size={40} color="#CCCCCC" />
          </View>
          <Text style={styles.emptyStateTitle}>No Notifications</Text>
          <Text style={styles.emptyStateDescription}>
            You're all caught up! New notifications will appear here.
          </Text>
        </View>
      )}

      {!permissionGranted && notificationsEnabled && !loading && (
        <View style={styles.permissionBanner}>
          <BellOff size={20} color="#FF3B30" />
          <Text style={styles.permissionText}>
            Notifications are disabled. Please enable them in your device
            settings.
          </Text>
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
  preferencesContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  preferenceTextContainer: {
    flex: 1,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  preferenceDescription: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  notificationCount: {
    fontSize: 14,
    color: '#666666',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
    padding: 8,
  },
  actionButtonText: {
    fontSize: 12,
    color: '#333333',
    marginLeft: 4,
  },
  clearButton: {},
  clearButtonText: {
    color: '#FF3B30',
  },
  notificationsList: {
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    margin: 16,
  },
  permissionText: {
    flex: 1,
    fontSize: 14,
    color: '#FF3B30',
    marginLeft: 8,
  },
});
