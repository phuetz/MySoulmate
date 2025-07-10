import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { Heart, Gift, Bell, MessageCircle, Mic, Video } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export interface Notification {
  id: string;
  type: 'message' | 'gift' | 'reminder' | 'voice' | 'video' | 'system';
  title: string;
  message: string;
  time: string;
  read: boolean;
  actionRoute?: string;
  companionAvatar?: string;
  imageUrl?: string;
}

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
}

export default function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const router = useRouter();

  const getIcon = () => {
    switch (notification.type) {
      case 'message':
        return <MessageCircle size={20} color="#FF6B8A" />;
      case 'gift':
        return <Gift size={20} color="#FF6B8A" />;
      case 'voice':
        return <Mic size={20} color="#FF6B8A" />;
      case 'video':
        return <Video size={20} color="#FF6B8A" />;
      case 'reminder':
        return <Bell size={20} color="#FF6B8A" />;
      default:
        return <Heart size={20} color="#FF6B8A" />;
    }
  };

  const handlePress = () => {
    onRead(notification.id);
    if (notification.actionRoute) {
      router.push(notification.actionRoute);
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.container, notification.read ? styles.readNotification : styles.unreadNotification]} 
      onPress={handlePress}
    >
      <View style={styles.iconContainer}>
        {getIcon()}
      </View>
      
      <View style={styles.contentContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>{notification.title}</Text>
          <Text style={styles.time}>{notification.time}</Text>
        </View>
        <Text style={styles.message}>{notification.message}</Text>
        {notification.imageUrl && (
          <Image source={{ uri: notification.imageUrl }} style={styles.image} />
        )}
      </View>
      
      {notification.companionAvatar && (
        <Image 
          source={{ uri: notification.companionAvatar }} 
          style={styles.avatar} 
        />
      )}
      
      {!notification.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  unreadNotification: {
    backgroundColor: '#FFF8FA',
  },
  readNotification: {
    backgroundColor: '#FFFFFF',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF0F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
  },
  time: {
    fontSize: 12,
    color: '#999999',
    marginLeft: 8,
  },
  message: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 12,
    backgroundColor: '#E1E1E1',
  },
  image: {
    marginTop: 8,
    width: '100%',
    height: 180,
    borderRadius: 8,
  },
  unreadDot: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B8A',
  },
});