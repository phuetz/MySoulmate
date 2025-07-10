import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

interface OfflineBannerProps {
  isConnected: boolean | null;
}

export default function OfflineBanner({ isConnected }: OfflineBannerProps) {
  if (isConnected === null || isConnected) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>You are offline</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FFC107',
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  text: {
    color: '#333333',
    fontSize: 13,
    fontWeight: '500',
  },
});
