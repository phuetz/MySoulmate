import React from 'react';
import { StyleSheet, View } from 'react-native';
import CategoryForm from '@/components/admin/CategoryForm';

export default function CreateCategoryScreen() {
  return (
    <View style={styles.container}>
      <CategoryForm />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
});