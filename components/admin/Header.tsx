import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { Bell, Search, Menu } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import NotificationBadge from '../NotificationBadge';

interface HeaderProps {
  title: string;
  toggleSidebar?: () => void;
  unreadNotifications?: number;
}

export default function Header({ title, toggleSidebar, unreadNotifications = 0 }: HeaderProps) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        {toggleSidebar && (
          <TouchableOpacity style={styles.menuButton} onPress={toggleSidebar}>
            <Menu size={24} color="#333333" />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.rightSection}>
        <TouchableOpacity style={styles.searchButton}>
          <Search size={20} color="#666666" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => router.push('/admin/notifications')}
        >
          <Bell size={20} color="#666666" />
          {unreadNotifications > 0 && (
            <NotificationBadge count={unreadNotifications} size="small" />
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.profileContainer} onPress={() => {}}>
          <Image
            source={{
              uri: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=300'
            }}
            style={styles.profilePic}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || 'Admin'}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'admin@example.com'}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E1E1E1',
  },
  profileInfo: {
    marginLeft: 12,
    display: 'none', // Hide on mobile
  },
  profileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  profileEmail: {
    fontSize: 12,
    color: '#666666',
  },
});