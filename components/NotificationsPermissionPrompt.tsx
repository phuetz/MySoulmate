import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal } from 'react-native';
import { Bell } from 'lucide-react-native';
import { requestNotificationPermissions } from '@/services/notificationService';

interface NotificationsPermissionPromptProps {
  visible: boolean;
  onClose: () => void;
  onPermissionChange: (granted: boolean) => void;
}

export default function NotificationsPermissionPrompt({ 
  visible, 
  onClose, 
  onPermissionChange 
}: NotificationsPermissionPromptProps) {
  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermissions();
    onPermissionChange(granted);
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Bell size={32} color="#FF6B8A" />
          </View>
          
          <Text style={styles.title}>Stay Connected</Text>
          <Text style={styles.description}>
            Enable notifications to get updates when your companion wants to talk to you
            or has something important to share.
          </Text>
          
          <TouchableOpacity 
            style={styles.allowButton}
            onPress={handleRequestPermission}
          >
            <Text style={styles.allowButtonText}>
              Enable Notifications
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.laterButton}
            onPress={onClose}
          >
            <Text style={styles.laterButtonText}>
              Maybe Later
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF0F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  allowButton: {
    backgroundColor: '#FF6B8A',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  allowButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  laterButton: {
    paddingVertical: 12,
  },
  laterButtonText: {
    color: '#666666',
    fontSize: 14,
  },
});