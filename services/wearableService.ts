import * as ExpoNotifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Send a quick notification to connected wearable devices (e.g. Apple Watch, Wear OS).
 * In a real implementation this would use platform specific APIs to relay
 * the notification to the paired watch. Here we simply schedule a local
 * notification which will also appear on the wearable if supported.
 */
export async function sendWearableNotification(
  title: string,
  body: string,
  data: any = {}
): Promise<boolean> {
  try {
    // For iOS/Android, wearable notifications mirror device notifications.
    await ExpoNotifications.scheduleNotificationAsync({
      content: { title, body, data },
      trigger: null,
    });
    return true;
  } catch (err) {
    console.log('Failed to send wearable notification', err);
    return false;
  }
}
