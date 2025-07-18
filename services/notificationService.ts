import { Platform } from 'react-native';
import * as ExpoNotifications from 'expo-notifications';
import api from './api';
import { sendWearableNotification } from './wearableService';
import { Notification } from '@/components/NotificationItem';
import { CompanionData } from '@/context/AppStateContext';

// Extend global Window interface for TypeScript
declare global {
  interface Window {
    Notification: typeof Notification;
  }
}

export { sendWearableNotification };

// This would use actual push notification services in production
// For this demo, we're simulating the functionality

export async function requestNotificationPermissions(): Promise<boolean> {
  // In a real app, we'd use expo-notifications to request permissions
  // For web, we'd use the browser's notification API

  console.log('Requesting notification permissions');

  if (Platform.OS === 'web') {
    // Web notification permission request
    try {
      if (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        window.Notification.permission !== 'granted'
      ) {
        const status = await window.Notification.requestPermission();
        return status === 'granted';
      }
      return (
        typeof window !== 'undefined' &&
        'Notification' in window &&
        window.Notification.permission === 'granted'
      );
    } catch (error) {
      console.log('Error requesting web notification permissions:', error);
      return false;
    }
  } else {
    // For this demo, we'll simulate successful permission on native
    return true;
  }
}

export async function registerDevicePushToken(userId?: string): Promise<string | null> {
  try {
    const { status } = await ExpoNotifications.getPermissionsAsync();
    let finalStatus = status;
    if (status !== 'granted') {
      const request = await ExpoNotifications.requestPermissionsAsync();
      finalStatus = request.status;
    }
    if (finalStatus !== 'granted') return null;
    const tokenData = await ExpoNotifications.getExpoPushTokenAsync();
    const token = tokenData.data;
    await api.post('/push/register', {
      token,
      userId,
      platform: Platform.OS,
    });
    return token;
  } catch (err) {
    console.log('Failed to register push token', err);
    return null;
  }
}

// Generate scheduled notifications based on companion data and user interactions
export function generateScheduledNotifications(
  companion: CompanionData,
): Notification[] {
  const notifications: Notification[] = [];
  const currentTime = new Date();

  // Generate a daily check-in notification if user hasn't interacted today
  const lastInteractionDate = new Date();
  lastInteractionDate.setHours(lastInteractionDate.getHours() - 24);

  notifications.push({
    id: `reminder-${Date.now()}`,
    type: 'reminder',
    title: `${companion.name} misses you!`,
    message: `It's been a while since you've talked. ${companion.name} would love to chat with you today.`,
    time: '2 hours ago',
    read: false,
    actionRoute: '/chat',
    companionAvatar: companion.avatarUrl,
    imageUrl: companion.avatarUrl,
  });

  // Generate a notification about a new gift available
  notifications.push({
    id: `gift-${Date.now() + 1}`,
    type: 'gift',
    title: 'New gifts available!',
    message:
      'Check out the newest items in the gift shop to surprise your companion.',
    time: 'Yesterday',
    read: true,
    actionRoute: '/gifts',
    imageUrl: 'https://images.pexels.com/photos/36026/rose-red-blossom-bloom-36026.jpeg?auto=compress&cs=tinysrgb&w=600',
  });

  // If premium is not enabled, send a notification about premium features
  if (!companion.isPremium) {
    notifications.push({
      id: `system-${Date.now() + 2}`,
      type: 'system',
      title: 'Unlock Premium Features',
      message:
        'Upgrade to premium to access exclusive content and deeper conversations.',
      time: '2 days ago',
      read: true,
      actionRoute: '/settings',
    });
  }

  // Custom message based on relationship level
  const relationshipLevel =
    companion.interactions > 50
      ? 'close'
      : companion.interactions > 30
        ? 'friendly'
        : 'new';

  let customMessage = '';

  if (relationshipLevel === 'close') {
    customMessage = `${companion.name} has something special to tell you. Come back for a meaningful conversation.`;
  } else if (relationshipLevel === 'friendly') {
    customMessage = `${companion.name} is thinking about you and wants to deepen your connection.`;
  } else {
    customMessage = `${companion.name} is excited to get to know you better.`;
  }

  notifications.push({
    id: `message-${Date.now() + 3}`,
    type: 'message',
    title: `New message from ${companion.name}`,
    message: customMessage,
    time: '3 days ago',
    read: true,
    actionRoute: '/chat',
    companionAvatar: companion.avatarUrl,
    imageUrl: companion.avatarUrl,
  });

  return notifications;
}

// Create a notification message based on the user's interactions with the companion
export function generateInteractionNotification(
  companion: CompanionData,
): Notification {
  let title: string;
  let message: string;

  if (companion.interactions > 50) {
    title = `${companion.name} is thinking of you`;
    message = `You and ${companion.name} have shared many moments together. Come back soon!`;
  } else if (companion.interactions > 20) {
    title = `Catch up with ${companion.name}`;
    message = `${companion.name} enjoyed your last conversation. Say hi again!`;
  } else {
    title = `Get to know ${companion.name}`;
    message = `Start chatting with ${companion.name} to build your relationship.`;
  }

  if (companion.gifts === 0) {
    message += ' You can send a first gift from the shop!';
  }

  return {
    id: `interaction-${Date.now()}`,
    type: 'reminder',
    title,
    message,
    time: 'Just now',
    read: false,
    actionRoute: '/chat',
    companionAvatar: companion.avatarUrl,
    imageUrl: companion.avatarUrl,
  };
}

// Schedule a local notification using expo-notifications
export async function scheduleLocalNotification(
  title: string,
  body: string,
  trigger: Date,
  data: any = {},
): Promise<string | null> {
  try {
    const id = await ExpoNotifications.scheduleNotificationAsync({
      content: { title, body, data },
      trigger,
    });
    return id;
  } catch (err) {
    console.log('Failed to schedule notification', err);
    return null;
  }
}

// Schedule a repeating daily notification at a specific hour and minute
export async function scheduleDailyNotification(
  title: string,
  body: string,
  hour: number,
  minute: number,
  data: any = {},
): Promise<string | null> {
  try {
    // Calculate first trigger time in the future
    const firstTrigger = new Date();
    firstTrigger.setHours(hour, minute, 0, 0);
    if (firstTrigger <= new Date()) {
      firstTrigger.setDate(firstTrigger.getDate() + 1);
    }

    const id = await ExpoNotifications.scheduleNotificationAsync({
      content: { title, body, data },
      trigger: { hour, minute, repeats: true },
    });
    return id;
  } catch (err) {
    console.log('Failed to schedule daily notification', err);
    return null;
  }
}

// Send a push notification
export async function sendPushNotification(
  token: string,
  title: string,
  body: string,
  data: any = {},
): Promise<boolean> {
  console.log('Sending push notification:', { token, title, body, data });

  // For web, we can use the browser's Notification API if available
  if (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    'Notification' in window
  ) {
    try {
      const notificationPermission = await requestNotificationPermissions();

      if (notificationPermission) {
        new window.Notification(title, {
          body,
          icon: data.avatar || '/favicon.ico',
        });
        return true;
      }
      return false;
    } catch (error) {
      console.log('Error sending web notification:', error);
      return false;
    }
  }

  try {
    await api.post('/push/send', {
      token,
      title,
      message: body,
      data,
    });
    return true;
  } catch (error) {
    console.log('Error sending push notification via API:', error);
    // Fallback to local notification
    try {
      await ExpoNotifications.scheduleNotificationAsync({
        content: { title, body, data },
        trigger: null,
      });
    } catch (_) {}
    return false;
  }
}

// Schedule notifications based on user preferences and app usage patterns
export function schedulePersonalizedNotifications(
  companion: CompanionData,
  userPreferences: { notificationsEnabled: boolean },
): void {
  if (!userPreferences.notificationsEnabled) return;

  // In a real app, this would set up push notifications based on user behavior patterns
  // For example, if the user typically uses the app in the evening, schedule notifications for that time

  const baseTime = new Date();

  // Send an initial notification based on recent interactions
  const interactionNotif = generateInteractionNotification(companion);
  const interactionTime = new Date(baseTime);
  interactionTime.setMinutes(interactionTime.getMinutes() + 10);
  scheduleLocalNotification(
    interactionNotif.title,
    interactionNotif.message,
    interactionTime,
    { route: interactionNotif.actionRoute },
  );

  // Schedule a check-in notification
  const checkInTime = new Date(baseTime);
  checkInTime.setHours(checkInTime.getHours() + 24);
  scheduleLocalNotification(
    `${companion.name} misses you!`,
    `It's been a while since you've talked. ${companion.name} would love to chat with you today.`,
    checkInTime,
    { route: '/chat' },
  );

  // Schedule a personalized message
  const messageTime = new Date(baseTime);
  messageTime.setHours(messageTime.getHours() + 6);
  scheduleLocalNotification(
    `New message from ${companion.name}`,
    `${companion.name} is thinking about you.`,
    messageTime,
    { route: '/chat' },
  );

  if (companion.gifts < 3) {
    const giftTime = new Date(baseTime);
    giftTime.setHours(giftTime.getHours() + 48);
    scheduleLocalNotification(
      'New gifts available!',
      'Check out the newest items in the gift shop to surprise your companion.',
      giftTime,
      { route: '/gifts' },
    );
  }
}
