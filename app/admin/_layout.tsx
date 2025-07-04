import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableWithoutFeedback, Dimensions, BackHandler } from 'react-native';
import { Slot } from 'expo-router';
import Header from '@/components/admin/Header';
import Sidebar from '@/components/admin/Sidebar';
import AdminRoute from '@/components/AdminRoute';

export default function AdminLayout() {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(2);

  useEffect(() => {
    // Handle back button on Android to close sidebar if open
    const backAction = () => {
      if (sidebarVisible) {
        setSidebarVisible(false);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [sidebarVisible]);

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const closeSidebar = () => {
    setSidebarVisible(false);
  };

  return (
    <AdminRoute>
      <View style={styles.container}>
        <Header 
          title="Admin Dashboard" 
          toggleSidebar={toggleSidebar}
          unreadNotifications={unreadNotifications} 
        />
        
        {/* Main content */}
        <View style={styles.content}>
          <Slot />
        </View>
        
        {/* Sidebar */}
        <Sidebar 
          isVisible={sidebarVisible}
          onClose={closeSidebar}
        />
        
        {/* Backdrop for sidebar */}
        {sidebarVisible && (
          <TouchableWithoutFeedback onPress={closeSidebar}>
            <View style={styles.backdrop} />
          </TouchableWithoutFeedback>
        )}
      </View>
    </AdminRoute>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    flex: 1,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 50,
  },
});