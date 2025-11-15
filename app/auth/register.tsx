import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Heart, User, Mail, Lock, CheckCircle } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validate = () => {
    const newErrors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};
    
    if (!name) newErrors.name = "Name is required";
    if (!email) newErrors.email = "Email is required";
    if (!password) newErrors.password = "Password is required";
    if (password.length < 8 ||
        !/[A-Z]/.test(password) ||
        !/[a-z]/.test(password) ||
        !/\d/.test(password) ||
        !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      newErrors.password =
        "Password must be at least 8 characters and include uppercase, lowercase, number and special character";
    }
    if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    
    try {
      await register(name, email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      Alert.alert('Registration Error', message);
    }
  };

  return (
    <LinearGradient
      colors={['#9C6ADE', '#FF6B8A', '#FF8FA3']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <Heart size={60} color="#FFFFFF" style={styles.logoIcon} />
          <Text style={styles.appTitle}>MySoulmate</Text>
          <Text style={styles.appSubtitle}>Create your account and find your companion</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Create Account</Text>

          <View style={styles.inputGroup}>
            <View style={styles.inputIconContainer}>
              <User size={20} color="#9C6ADE" />
              <TextInput
                style={[styles.input, errors.name ? styles.inputError : {}]}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor="#999"
              />
            </View>
            {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
          </View>

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
            {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
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
            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputIconContainer}>
              <CheckCircle size={20} color="#9C6ADE" />
              <TextInput
                style={[styles.input, errors.confirmPassword ? styles.inputError : {}]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm your password"
                placeholderTextColor="#999"
                secureTextEntry
              />
            </View>
            {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
          </View>

          <TouchableOpacity
            style={styles.registerButton}
            onPress={handleRegister}
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
                <Text style={styles.registerButtonText}>Create Account</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => router.push('/auth/login')}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
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
    paddingHorizontal: 20,
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
  registerButton: {
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
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 28,
  },
  loginText: {
    color: '#666666',
    fontSize: 15,
  },
  loginLink: {
    color: '#FF6B8A',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 6,
  },
});