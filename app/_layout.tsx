import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AppStateProvider } from '@/context/AppStateContext';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <ThemeProvider>
      <AuthProvider>
        <AppStateProvider>
          <ErrorBoundary>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
              <Stack.Screen name="auth/login" options={{ headerShown: false, title: 'Login' }} />
              <Stack.Screen name="auth/register" options={{ headerShown: false, title: 'Register' }} />
              <Stack.Screen name="auth/forgot-password" options={{ headerShown: false, title: 'Forgot Password' }} />
              <Stack.Screen name="auth/reset-password" options={{ headerShown: false, title: 'Reset Password' }} />
              <Stack.Screen name="admin" options={{ headerShown: false }} />
            </Stack>
          </ErrorBoundary>
          <StatusBar style="auto" />
        </AppStateProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}