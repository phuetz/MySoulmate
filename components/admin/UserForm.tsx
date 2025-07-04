import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Switch, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { ChevronLeft, CheckCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import { userService, User } from '@/services/userService';

interface UserFormProps {
  userId?: string;
  onSubmit?: (user: User) => void;
}

export default function UserForm({ userId, onSubmit }: UserFormProps) {
  const isEditMode = !!userId;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user',
    isActive: true,
    password: '', // Only for create mode
    confirmPassword: '' // Only for create mode
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isEditMode && userId) {
      fetchUserData(userId);
    }
  }, [userId]);

  const fetchUserData = async (id: string) => {
    setIsLoading(true);
    try {
      const userData = await userService.getUserById(id);
      setFormData({
        name: userData.name,
        email: userData.email,
        role: userData.role,
        isActive: userData.isActive,
        password: '',
        confirmPassword: ''
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch user data');
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
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    
    if (!isEditMode) {
      if (!formData.password) newErrors.password = 'Password is required';
      else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
      
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    
    setIsSaving(true);
    
    try {
      if (isEditMode && userId) {
        // Update existing user
        const userData: Partial<User> = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          isActive: formData.isActive
        };
        
        // Only include password if it was provided
        if (formData.password) {
          userData.password = formData.password;
        }
        
        const updatedUser = await userService.updateUser(userId, userData);
        Alert.alert('Success', 'User updated successfully');
        
        if (onSubmit) onSubmit(updatedUser);
      } else {
        // Create new user
        // In a real app, this would call an API to create the user
        Alert.alert('Success', 'User created successfully');
        
        // Simulate user creation for demo
        const newUser = {
          id: Date.now().toString(),
          name: formData.name,
          email: formData.email,
          role: formData.role,
          isActive: formData.isActive,
          createdAt: new Date().toISOString()
        };
        
        if (onSubmit) onSubmit(newUser as User);
      }
      
      // Navigate back
      if (router.canGoBack()) {
        router.back();
      } else {
        router.push('/admin/users');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save user');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B8A" />
        <Text style={styles.loadingText}>Loading user data...</Text>
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
            router.push('/admin/users');
          }
        }}>
          <ChevronLeft size={24} color="#333333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditMode ? 'Edit User' : 'Create User'}</Text>
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
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            value={formData.name}
            onChangeText={(value) => handleChange('name', value)}
            placeholder="Enter user name"
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            value={formData.email}
            onChangeText={(value) => handleChange('email', value)}
            placeholder="Enter email address"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>

        {!isEditMode && (
          <>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={[styles.input, errors.password && styles.inputError]}
                value={formData.password}
                onChangeText={(value) => handleChange('password', value)}
                placeholder="Enter password"
                secureTextEntry
              />
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={[styles.input, errors.confirmPassword && styles.inputError]}
                value={formData.confirmPassword}
                onChangeText={(value) => handleChange('confirmPassword', value)}
                placeholder="Confirm password"
                secureTextEntry
              />
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}
            </View>
          </>
        )}

        <View style={styles.formGroup}>
          <Text style={styles.label}>User Role</Text>
          <View style={styles.roleSelector}>
            <TouchableOpacity
              style={[
                styles.roleOption,
                formData.role === 'user' && styles.roleOptionSelected
              ]}
              onPress={() => handleChange('role', 'user')}
            >
              <Text
                style={[
                  styles.roleOptionText,
                  formData.role === 'user' && styles.roleOptionTextSelected
                ]}
              >
                User
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.roleOption,
                formData.role === 'admin' && styles.roleOptionSelected
              ]}
              onPress={() => handleChange('role', 'admin')}
            >
              <Text
                style={[
                  styles.roleOptionText,
                  formData.role === 'admin' && styles.roleOptionTextSelected
                ]}
              >
                Admin
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formGroup}>
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Account Active</Text>
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
              ? 'User can log in and access the system' 
              : 'User account is deactivated'}
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
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
  },
  roleSelector: {
    flexDirection: 'row',
  },
  roleOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: '#E1E1E1',
    alignItems: 'center',
  },
  roleOptionSelected: {
    backgroundColor: '#FFF0F3',
    borderColor: '#FF6B8A',
  },
  roleOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  roleOptionTextSelected: {
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