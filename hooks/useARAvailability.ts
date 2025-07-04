import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

// This hook checks if AR features are available on the current device
export function useARAvailability() {
  const [isARSupported, setIsARSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkARSupport() {
      try {
        // For web platform, AR is not fully supported yet in most browsers
        // In a real app, we could check for WebXR support
        if (Platform.OS === 'web') {
          setIsARSupported(false);
          setIsLoading(false);
          return;
        }

        // On native platforms, we'd check for ARKit/ARCore availability
        // For iOS (ARKit)
        if (Platform.OS === 'ios') {
          // In a real app, we'd use ARKit compatibility check
          // For demo purposes, we'll assume it's supported on iOS
          setIsARSupported(true);
        } 
        // For Android (ARCore)
        else if (Platform.OS === 'android') {
          // In a real app, we'd use ARCore availability check
          // For demo purposes, we'll assume it's supported on Android
          setIsARSupported(true);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error checking AR support:', error);
        setIsARSupported(false);
        setIsLoading(false);
      }
    }

    checkARSupport();
  }, []);

  return { isARSupported, isLoading };
}