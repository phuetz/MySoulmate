import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, Switch, TextInput, ScrollView } from 'react-native';
import { Plus, Edit, Trash2, X, Check } from 'lucide-react-native';
import { subscriptionService, SubscriptionPlan } from '@/services/subscriptionService';

export default function PlansScreen() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [features, setFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState('');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const plansData = await subscriptionService.getPlans();
      setPlans(plansData);
    } catch (error) {
      console.error('Error fetching plans:', error);
      Alert.alert('Error', 'Failed to load subscription plans');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPlans();
  };

  const handleCreatePlan = () => {
    // Initialize a new empty plan for editing
    setEditingPlan({
      id: '',
      name: '',
      description: '',
      price: 0,
      billingCycle: 'monthly',
      features: [],
      isActive: true,
    });
    setFeatures([]);
    setIsEditing(true);
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan({...plan});
    setFeatures([...plan.features]);
    setIsEditing(true);
  };

  const handleDeletePlan = (planId: string, planName: string) => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete the "${planName}" plan? This may affect existing subscribers.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await subscriptionService.deletePlan(planId);
              setPlans(plans.filter(plan => plan.id !== planId));
              Alert.alert('Success', 'Plan deleted successfully');
            } catch (error) {
              console.error('Error deleting plan:', error);
              Alert.alert('Error', 'Failed to delete plan');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleAddFeature = () => {
    if (newFeature.trim()) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature('');
    }
  };

  const handleRemoveFeature = (index: number) => {
    const updatedFeatures = [...features];
    updatedFeatures.splice(index, 1);
    setFeatures(updatedFeatures);
  };

  const validatePlan = () => {
    if (!editingPlan) return false;
    
    if (!editingPlan.name.trim()) {
      Alert.alert('Validation Error', 'Plan name is required');
      return false;
    }
    
    if (editingPlan.price <= 0) {
      Alert.alert('Validation Error', 'Price must be greater than zero');
      return false;
    }
    
    return true;
  };

  const handleSavePlan = async () => {
    if (!validatePlan() || !editingPlan) return;
    
    try {
      setLoading(true);
      
      const planData = {
        ...editingPlan,
        features: features,
      };
      
      let savedPlan: SubscriptionPlan;
      
      if (editingPlan.id) {
        // Update existing plan
        savedPlan = await subscriptionService.updatePlan(editingPlan.id, planData);
        setPlans(plans.map(p => p.id === savedPlan.id ? savedPlan : p));
        Alert.alert('Success', 'Plan updated successfully');
      } else {
        // Create new plan
        savedPlan = await subscriptionService.createPlan(planData as Omit<SubscriptionPlan, 'id'>);
        setPlans([...plans, savedPlan]);
        Alert.alert('Success', 'Plan created successfully');
      }
      
      setIsEditing(false);
      setEditingPlan(null);
    } catch (error) {
      console.error('Error saving plan:', error);
      Alert.alert('Error', 'Failed to save plan');
    } finally {
      setLoading(false);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditingPlan(null);
    setFeatures([]);
  };

  const renderPlanItem = ({ item }: { item: SubscriptionPlan }) => (
    <View style={styles.planItem}>
      <View style={styles.planHeader}>
        <View>
          <Text style={styles.planName}>{item.name}</Text>
          <Text style={styles.planPrice}>
            ${item.price} / {item.billingCycle}
          </Text>
        </View>
        
        <View style={[
          styles.statusBadge,
          item.isActive ? styles.activeBadge : styles.inactiveBadge
        ]}>
          <Text style={styles.statusText}>
            {item.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>
      
      <Text style={styles.planDescription}>{item.description}</Text>
      
      <View style={styles.featuresList}>
        <Text style={styles.featuresTitle}>Features:</Text>
        {item.features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
      
      <View style={styles.planActions}>
        <TouchableOpacity 
          style={styles.editButton} 
          onPress={() => handleEditPlan(item)}
        >
          <Edit size={16} color="#4CAF50" />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeletePlan(item.id, item.name)}
        >
          <Trash2 size={16} color="#FF3B30" />
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPlanEditor = () => {
    if (!editingPlan) return null;
    
    return (
      <View style={styles.editorContainer}>
        <View style={styles.editorHeader}>
          <Text style={styles.editorTitle}>
            {editingPlan.id ? 'Edit Plan' : 'Create Plan'}
          </Text>
          <TouchableOpacity style={styles.closeButton} onPress={cancelEditing}>
            <X size={20} color="#666666" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.editorContent}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Plan Name</Text>
            <TextInput
              style={styles.input}
              value={editingPlan.name}
              onChangeText={(value) => setEditingPlan({...editingPlan, name: value})}
              placeholder="Enter plan name"
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={editingPlan.description}
              onChangeText={(value) => setEditingPlan({...editingPlan, description: value})}
              placeholder="Enter plan description"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
          
          <View style={styles.formGroupRow}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Price</Text>
              <TextInput
                style={styles.input}
                value={editingPlan.price.toString()}
                onChangeText={(value) => setEditingPlan({
                  ...editingPlan, 
                  price: isNaN(parseFloat(value)) ? 0 : parseFloat(value)
                })}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />
            </View>
            
            <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Billing Cycle</Text>
              <View style={styles.cycleSelector}>
                <TouchableOpacity
                  style={[
                    styles.cycleOption,
                    editingPlan.billingCycle === 'weekly' && styles.selectedCycleOption
                  ]}
                  onPress={() => setEditingPlan({...editingPlan, billingCycle: 'weekly'})}
                >
                  <Text style={[
                    styles.cycleOptionText,
                    editingPlan.billingCycle === 'weekly' && styles.selectedCycleOptionText
                  ]}>
                    Weekly
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.cycleOption,
                    editingPlan.billingCycle === 'monthly' && styles.selectedCycleOption
                  ]}
                  onPress={() => setEditingPlan({...editingPlan, billingCycle: 'monthly'})}
                >
                  <Text style={[
                    styles.cycleOptionText,
                    editingPlan.billingCycle === 'monthly' && styles.selectedCycleOptionText
                  ]}>
                    Monthly
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.cycleOption,
                    editingPlan.billingCycle === 'yearly' && styles.selectedCycleOption
                  ]}
                  onPress={() => setEditingPlan({...editingPlan, billingCycle: 'yearly'})}
                >
                  <Text style={[
                    styles.cycleOptionText,
                    editingPlan.billingCycle === 'yearly' && styles.selectedCycleOptionText
                  ]}>
                    Yearly
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Features</Text>
            
            {features.map((feature, index) => (
              <View key={index} style={styles.featureInputItem}>
                <Text style={styles.featureInputText}>{feature}</Text>
                <TouchableOpacity
                  style={styles.removeFeatureButton}
                  onPress={() => handleRemoveFeature(index)}
                >
                  <X size={16} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            ))}
            
            <View style={styles.addFeatureContainer}>
              <TextInput
                style={styles.featureInput}
                value={newFeature}
                onChangeText={setNewFeature}
                placeholder="Add a feature..."
                onSubmitEditing={handleAddFeature}
              />
              <TouchableOpacity 
                style={styles.addFeatureButton}
                onPress={handleAddFeature}
                disabled={!newFeature.trim()}
              >
                <Plus size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.formGroup}>
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Plan Active</Text>
              <Switch
                value={editingPlan.isActive}
                onValueChange={(value) => setEditingPlan({...editingPlan, isActive: value})}
                trackColor={{ false: '#E1E1E1', true: '#FF6B8A' }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#E1E1E1"
              />
            </View>
            <Text style={styles.switchDescription}>
              {editingPlan.isActive 
                ? 'Plan is visible and can be purchased' 
                : 'Plan is hidden from subscription options'}
            </Text>
          </View>
          
          <View style={styles.formGroup}>
            <View style={styles.formGroupRow}>
              <Text style={styles.label}>Trial Period (days)</Text>
              <TextInput
                style={[styles.input, styles.trialInput]}
                value={editingPlan.trialDays?.toString() || '0'}
                onChangeText={(value) => setEditingPlan({
                  ...editingPlan,
                  trialDays: isNaN(parseInt(value)) ? 0 : parseInt(value)
                })}
                placeholder="0"
                keyboardType="number-pad"
              />
            </View>
            <Text style={styles.helpText}>
              Enter 0 for no trial period
            </Text>
          </View>
        </ScrollView>
        
        <View style={styles.editorActions}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={cancelEditing}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSavePlan}
          >
            <Check size={16} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>Save Plan</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isEditing) {
    return renderPlanEditor();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Subscription Plans</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleCreatePlan}
        >
          <Plus size={18} color="#FFFFFF" />
          <Text style={styles.addButtonText}>New Plan</Text>
        </TouchableOpacity>
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B8A" />
          <Text style={styles.loadingText}>Loading plans...</Text>
        </View>
      ) : plans.length > 0 ? (
        <FlatList
          data={plans}
          renderItem={renderPlanItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.planList}
          onRefresh={handleRefresh}
          refreshing={refreshing}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No subscription plans found</Text>
          <TouchableOpacity 
            style={styles.createFirstButton}
            onPress={handleCreatePlan}
          >
            <Text style={styles.createFirstButtonText}>Create Your First Plan</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B8A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666666',
  },
  planList: {
    padding: 16,
    paddingTop: 8,
  },
  planItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9C6ADE',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: '#E8F5E9',
  },
  inactiveBadge: {
    backgroundColor: '#FFEBEE',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333333',
  },
  planDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 20,
  },
  featuresList: {
    marginBottom: 16,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF6B8A',
    marginRight: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#333333',
  },
  planActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
    color: '#333333',
  },
  deleteButtonText: {
    color: '#FF3B30',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#999999',
    marginBottom: 16,
  },
  createFirstButton: {
    backgroundColor: '#FF6B8A',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  createFirstButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  editorContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  editorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  closeButton: {
    padding: 8,
  },
  editorContent: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  formGroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E1E1E1',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  trialInput: {
    width: 80,
    marginLeft: 8,
  },
  helpText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  cycleSelector: {
    flexDirection: 'row',
  },
  cycleOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E1E1E1',
  },
  selectedCycleOption: {
    backgroundColor: '#FF6B8A',
    borderColor: '#FF6B8A',
  },
  cycleOptionText: {
    fontSize: 14,
    color: '#666666',
  },
  selectedCycleOptionText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  featureInputItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
  },
  featureInputText: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
  },
  removeFeatureButton: {
    padding: 4,
  },
  addFeatureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E1E1E1',
    marginRight: 8,
  },
  addFeatureButton: {
    backgroundColor: '#9C6ADE',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
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
  editorActions: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginLeft: 8,
  },
  saveButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
    marginLeft: 4,
  },
});