import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Switch, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { ChevronLeft, CheckCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import { categoryService, Category } from '@/services/categoryService';

interface CategoryFormProps {
  categoryId?: string;
  onSubmit?: (category: Category) => void;
}

export default function CategoryForm({ categoryId, onSubmit }: CategoryFormProps) {
  const isEditMode = !!categoryId;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isEditMode && categoryId) {
      fetchCategoryData(categoryId);
    }
  }, [categoryId]);

  const fetchCategoryData = async (id: string) => {
    setIsLoading(true);
    try {
      const categoryData = await categoryService.getCategoryById(id);
      setFormData({
        name: categoryData.name,
        description: categoryData.description || '',
        isActive: categoryData.isActive
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch category data');
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
    if (formData.name.trim().length < 2) newErrors.name = 'Name must be at least 2 characters';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    
    setIsSaving(true);
    
    try {
      const categoryData = {
        name: formData.name,
        description: formData.description,
        isActive: formData.isActive
      };
      
      if (isEditMode && categoryId) {
        // Update existing category
        const updatedCategory = await categoryService.updateCategory(categoryId, categoryData);
        Alert.alert('Success', 'Category updated successfully');
        
        if (onSubmit) onSubmit(updatedCategory);
      } else {
        // Create new category
        const newCategory = await categoryService.createCategory(categoryData as Omit<Category, 'id'>);
        Alert.alert('Success', 'Category created successfully');
        
        if (onSubmit) onSubmit(newCategory);
      }
      
      // Navigate back
      if (router.canGoBack()) {
        router.back();
      } else {
        router.push('/admin/categories');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save category');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B8A" />
        <Text style={styles.loadingText}>Loading category data...</Text>
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
            router.push('/admin/categories');
          }
        }}>
          <ChevronLeft size={24} color="#333333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditMode ? 'Edit Category' : 'Create Category'}</Text>
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
          <Text style={styles.label}>Category Name</Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            value={formData.name}
            onChangeText={(value) => handleChange('name', value)}
            placeholder="Enter category name"
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.textArea, errors.description && styles.inputError]}
            value={formData.description}
            onChangeText={(value) => handleChange('description', value)}
            placeholder="Enter category description"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
        </View>

        <View style={styles.formGroup}>
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Category Active</Text>
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
              ? 'Category is visible and products within it can be browsed' 
              : 'Category is hidden from view'}
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
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
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