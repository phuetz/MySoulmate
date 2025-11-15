import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { Heart, Lock, Mail } from 'lucide-react-native';

WebBrowser.maybeCompleteAuthSession();
import { useAuth } from '@/context/AuthContext';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { authService } from '@/services/authService';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, refreshToken, loginWithGoogle } = useAuth();
  const { isHardwareAvailable, isEnrolled, authenticate } = useBiometricAuth();
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: process.env.GOOGLE_EXPO_CLIENT_ID,
    iosClientId: process.env.GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.GOOGLE_ANDROID_CLIENT_ID
  });

  const [hasSavedSession, setHasSavedSession] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );

  useEffect(() => {
    authService.getRefreshToken().then((token) => setHasSavedSession(!!token));
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.authentication?.idToken;
      if (idToken) {
        loginWithGoogle(idToken)
          .then(() => router.replace('/(tabs)'))
          .catch(() => Alert.alert('Login Error', 'Google login failed'));
      }
    }
  }, [response]);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) newErrors.email = 'Email is required';
    if (!password) newErrors.password = 'Password is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Login failed. Please try again.';
      Alert.alert('Login Error', message);
    }
  };

  const handleBiometricLogin = async () => {
    if (!hasSavedSession) {
      Alert.alert(
        'Biometric Login',
        'No saved session found. Please login normally first.',
      );
      return;
    }

    if (!isHardwareAvailable || !isEnrolled) {
      Alert.alert('Biometric Login', 'Biometric authentication not available.');
      return;
    }

    const result = await authenticate();
    if (result.success) {
      try {
        await refreshToken();
        router.replace('/(tabs)');
      } catch (error) {
        Alert.alert(
          'Login Error',
          'Failed to restore session. Please login manually.',
        );
      }
    }
  };

  return (
    <LinearGradient
      colors={['#FF6B8A', '#9C6ADE', '#6B5FF6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.headerSection}>
        <Heart size={60} color="#FFFFFF" style={styles.logoIcon} />
        <Text style={styles.appTitle}>MySoulmate</Text>
        <Text style={styles.appSubtitle}>Welcome back to your companion</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.title}>Login</Text>

        <View style={styles.inputGroup}>
          <View style={styles.inputIconContainer}>
            <Mail size={20} color="#9C6ADE" />
            <TextInput
              style={[styles.input, errors.email ? styles.inputError : {}]}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          {errors.email ? (
            <Text style={styles.errorText}>{errors.email}</Text>
          ) : null}
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.inputIconContainer}>
            <Lock size={20} color="#9C6ADE" />
            <TextInput
              style={[styles.input, errors.password ? styles.inputError : {}]}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor="#999"
              secureTextEntry
            />
          </View>
          {errors.password ? (
            <Text style={styles.errorText}>{errors.password}</Text>
          ) : null}
        </View>

        <TouchableOpacity onPress={() => router.push('/auth/forgot-password')}>
          <Text style={styles.forgotPasswordLink}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={isLoading}
        >
          <LinearGradient
            colors={['#FF6B8A', '#FF8FA3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.googleButton}
          onPress={() => promptAsync()}
          disabled={!request}
        >
          <Text style={styles.googleButtonText}>Login with Google</Text>
        </TouchableOpacity>

        {hasSavedSession && (
          <TouchableOpacity
            style={styles.biometricButton}
            onPress={handleBiometricLogin}
          >
            <Text style={styles.biometricButtonText}>
              Login with Biometrics
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => router.push('/auth/register')}>
            <Text style={styles.registerLink}>Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoIcon: {
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  appSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 28,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    backdropFilter: 'blur(10px)',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 28,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    paddingLeft: 16,
    borderWidth: 2,
    borderColor: '#E8E8E8',
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: 'transparent',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 6,
    marginLeft: 4,
  },
  loginButton: {
    borderRadius: 16,
    marginTop: 24,
    overflow: 'hidden',
    shadowColor: '#FF6B8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonGradient: {
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  biometricButton: {
    backgroundColor: 'rgba(156, 106, 222, 0.1)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 2,
    borderColor: '#9C6ADE',
  },
  biometricButtonText: {
    color: '#9C6ADE',
    fontSize: 15,
    fontWeight: '600',
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 2,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  googleButtonText: {
    color: '#333',
    fontSize: 15,
    fontWeight: '600',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
  },
  registerText: {
    color: '#666666',
    fontSize: 15,
  },
  registerLink: {
    color: '#FF6B8A',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 6,
  },
  forgotPasswordLink: {
    color: '#9C6ADE',
    fontSize: 14,
    marginTop: 12,
    alignSelf: 'flex-end',
    fontWeight: '600',
  },
});
