import React from 'react';
import { StyleSheet, View } from 'react-native';
import UserForm from '@/components/admin/UserForm';

export default function CreateUserScreen() {
  return (
    <View style={styles.container}>
      <UserForm />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
});