import React from 'react';
import { StyleSheet, View } from 'react-native';
import ProductForm from '@/components/admin/ProductForm';

export default function CreateProductScreen() {
  return (
    <View style={styles.container}>
      <ProductForm />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
});