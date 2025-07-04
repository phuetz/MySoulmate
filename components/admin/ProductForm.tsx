import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Switch, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';
import { ChevronLeft, CheckCircle, X, Upload } from 'lucide-react-native';
import { router } from 'expo-router';
import { productService, Product } from '@/services/productService';
import { categoryService, Category } from '@/services/categoryService';

interface ProductFormProps {
  productId?: string;
  onSubmit?: (product: Product) => void;
}

export default function ProductForm({ productId, onSubmit }: ProductFormProps) {
  const isEditMode = !!productId;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    imageUrl: '',
    categoryId: '',
    isActive: true
  });
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  useEffect(() => {
    fetchCategories();
    
    if (isEditMode && productId) {
      fetchProductData(productId);
    }
  }, [productId]);

  const fetchCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const data = await categoryService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      Alert.alert('Error', 'Failed to load categories');
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const fetchProductData = async (id: string) => {
    setIsLoading(true);
    try {
      const productData = await productService.getProductById(id);
      setFormData({
        name: productData.name,
        description: productData.description || '',
        price: productData.price.toString(),
        stock: productData.stock?.toString() || '',
        imageUrl: productData.imageUrl || '',
        categoryId: productData.categoryId || '',
        isActive: productData.isActive
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch product data');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    
    if (!formData.price.trim()) {
      newErrors.price = 'Price is required';
    } else if (isNaN(Number(formData.price)) || Number(formData.price) < 0) {
      newErrors.price = 'Price must be a positive number';
    }
    
    if (formData.stock.trim() && (isNaN(Number(formData.stock)) || Number(formData.stock) < 0)) {
      newErrors.stock = 'Stock must be a positive number';
    }
    
    if (formData.imageUrl.trim() && !formData.imageUrl.match(/^https?:\/\/.*$/i)) {
      newErrors.imageUrl = 'Image URL must be a valid URL';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    
    setIsSaving(true);
    
    try {
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        stock: formData.stock ? parseInt(formData.stock) : 0,
        imageUrl: formData.imageUrl,
        categoryId: formData.categoryId || null,
        isActive: formData.isActive
      };
      
      if (isEditMode && productId) {
        // Update existing product
        const updatedProduct = await productService.updateProduct(productId, productData);
        Alert.alert('Success', 'Product updated successfully');
        
        if (onSubmit) onSubmit(updatedProduct);
      } else {
        // Create new product
        const newProduct = await productService.createProduct(productData as Omit<Product, 'id'>);
        Alert.alert('Success', 'Product created successfully');
        
        if (onSubmit) onSubmit(newProduct);
      }
      
      // Navigate back
      if (router.canGoBack()) {
        router.back();
      } else {
        router.push('/admin/products');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save product');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const clearImage = () => {
    handleChange('imageUrl', '');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B8A" />
        <Text style={styles.loadingText}>Loading product data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.push('/admin/products');
          }
        }}>
          <ChevronLeft size={24} color="#333333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditMode ? 'Edit Product' : 'Create Product'}</Text>
        <TouchableOpacity 
          style={[styles.saveButton, isSaving && styles.savingButton]} 
          onPress={handleSubmit}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <CheckCircle size={16} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Save</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Product Name</Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            value={formData.name}
            onChangeText={(value) => handleChange('name', value)}
            placeholder="Enter product name"
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.textArea, errors.description && styles.inputError]}
            value={formData.description}
            onChangeText={(value) => handleChange('description', value)}
            placeholder="Enter product description"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
        </View>

        <View style={styles.formGroupRow}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Price</Text>
            <TextInput
              style={[styles.input, errors.price && styles.inputError]}
              value={formData.price}
              onChangeText={(value) => handleChange('price', value)}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
            {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
          </View>

          <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Stock</Text>
            <TextInput
              style={[styles.input, errors.stock && styles.inputError]}
              value={formData.stock}
              onChangeText={(value) => handleChange('stock', value)}
              placeholder="0"
              keyboardType="number-pad"
            />
            {errors.stock && <Text style={styles.errorText}>{errors.stock}</Text>}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Image URL</Text>
          <View style={styles.imageUrlContainer}>
            <TextInput
              style={[
                styles.input, 
                styles.imageUrlInput,
                errors.imageUrl && styles.inputError
              ]}
              value={formData.imageUrl}
              onChangeText={(value) => handleChange('imageUrl', value)}
              placeholder="https://example.com/image.jpg"
              autoCapitalize="none"
            />
            {formData.imageUrl ? (
              <TouchableOpacity style={styles.clearButton} onPress={clearImage}>
                <X size={16} color="#666666" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.uploadButton}>
                <Upload size={16} color="#666666" />
              </TouchableOpacity>
            )}
          </View>
          {errors.imageUrl && <Text style={styles.errorText}>{errors.imageUrl}</Text>}
        </View>

        {formData.imageUrl && (
          <View style={styles.imagePreviewContainer}>
            <Image
              source={{ uri: formData.imageUrl }}
              style={styles.imagePreview}
              resizeMode="cover"
            />
          </View>
        )}

        <View style={styles.formGroup}>
          <Text style={styles.label}>Category</Text>
          {isLoadingCategories ? (
            <ActivityIndicator size="small" color="#FF6B8A" style={styles.categoriesLoading} />
          ) : (
            <View style={styles.categorySelector}>
              <TouchableOpacity
                style={[
                  styles.categoryOption,
                  !formData.categoryId && styles.categoryOptionSelected
                ]}
                onPress={() => handleChange('categoryId', '')}
              >
                <Text
                  style={[
                    styles.categoryOptionText,
                    !formData.categoryId && styles.categoryOptionTextSelected
                  ]}
                >
                  None
                </Text>
              </TouchableOpacity>

              {categories.map(category => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryOption,
                    formData.categoryId === category.id && styles.categoryOptionSelected
                  ]}
                  onPress={() => handleChange('categoryId', category.id)}
                >
                  <Text
                    style={[
                      styles.categoryOptionText,
                      formData.categoryId === category.id && styles.categoryOptionTextSelected
                    ]}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.formGroup}>
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Product Active</Text>
            <Switch
              value={formData.isActive}
              onValueChange={(value) => handleChange('isActive', value)}
              trackColor={{ false: '#E1E1E1', true: '#FF6B8A' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#E1E1E1"
            />
          </View>
          <Text style={styles.switchDescription}>
            {formData.isActive 
              ? 'Product is visible to customers and can be purchased' 
              : 'Product is hidden from customers and cannot be purchased'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  savingButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    marginLeft: 4,
  },
  formContainer: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  formGroupRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E1E1E1',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E1E1E1',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    height: 100,
  },
  imageUrlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageUrlInput: {
    flex: 1,
    paddingRight: 40,
  },
  uploadButton: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
  },
  imagePreviewContainer: {
    marginBottom: 20,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#E1E1E1',
  },
  categoriesLoading: {
    marginTop: 10,
  },
  categorySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryOptionSelected: {
    backgroundColor: '#FFF0F3',
    borderColor: '#FF6B8A',
  },
  categoryOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  categoryOptionTextSelected: {
    color: '#FF6B8A',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  switchDescription: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
});