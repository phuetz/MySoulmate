import { useState, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';

export function useBiometricAuth() {
  const [isHardwareAvailable, setIsHardwareAvailable] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    async function checkBiometrics() {
      try {
        const hardware = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setIsHardwareAvailable(hardware);
        setIsEnrolled(enrolled);
      } catch (error) {
        console.log('Biometric check failed:', error);
        setIsHardwareAvailable(false);
        setIsEnrolled(false);
      }
    }
    checkBiometrics();
  }, []);

  const authenticate = async () => {
    if (!isHardwareAvailable || !isEnrolled) {
      return {
        success: false,
      } as LocalAuthentication.LocalAuthenticationResult;
    }
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate',
      });
      return result;
    } catch (error) {
      console.log('Biometric auth error:', error);
      return {
        success: false,
      } as LocalAuthentication.LocalAuthenticationResult;
    }
  };

  return { isHardwareAvailable, isEnrolled, authenticate };
}
