import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAppState } from '@/context/AppStateContext';
import { generateScheduledNotifications } from '@/services/notificationService';

export default function Root() {
  const { companion, setUnreadNotifications } = useAppState();
  
  // Initialize notifications when app starts
  useEffect(() => {
    if (companion.notificationsEnabled) {
      // Generate initial notifications
      const initialNotifications = generateScheduledNotifications(companion);
      
      // Count unread notifications
      const unreadCount = initialNotifications.filter(n => !n.read).length;
      setUnreadNotifications(unreadCount);
    }
  }, []);
  
  // Redirect to the tabs navigation
  return <Redirect href="/(tabs)" />;
}