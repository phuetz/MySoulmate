import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput, Switch } from 'react-native';
import { Search, Filter, CreditCard, FileText, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { subscriptionService, Subscriber, SubscriptionPlan } from '@/services/subscriptionService';

export default function SubscriptionsScreen() {
  const router = useRouter();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    planId: '',
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });

  useEffect(() => {
    fetchSubscriptionPlans();
    fetchSubscribers();
  }, []);

  const fetchSubscriptionPlans = async () => {
    try {
      const plansData = await subscriptionService.getPlans();
      setPlans(plansData);
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      Alert.alert('Error', 'Failed to load subscription plans');
    }
  };

  const fetchSubscribers = async (page = 1) => {
    try {
      setLoading(true);
      const response = await subscriptionService.getSubscribers({
        ...filters,
        page
      });

      if (page === 1) {
        setSubscribers(response.subscribers);
      } else {
        setSubscribers(prev => [...prev, ...response.subscribers]);
      }

      setPagination({
        currentPage: response.currentPage,
        totalPages: response.totalPages,
        totalItems: response.totalItems
      });
    } catch (error) {
      console.error('Error fetching subscribers:', error);
      Alert.alert('Error', 'Failed to load subscribers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSubscribers(1);
  };

  const handleLoadMore = () => {
    if (pagination.currentPage < pagination.totalPages && !loading) {
      fetchSubscribers(pagination.currentPage + 1);
    }
  };

  const handleSearch = () => {
    fetchSubscribers(1);
  };

  const applyFilters = () => {
    fetchSubscribers(1);
    setShowFilters(false);
  };

  const resetFilters = () => {
    const resetFiltersData = {
      status: '',
      planId: '',
      startDate: '',
      endDate: ''
    };
    setFilters(resetFiltersData);
    fetchSubscribers(1);
    setShowFilters(false);
  };

  const handleToggleAutoRenew = async (subscriberId: string, autoRenew: boolean) => {
    try {
      await subscriptionService.updateAutoRenew(subscriberId, !autoRenew);
      
      // Update local state
      setSubscribers(prev => 
        prev.map(sub => 
          sub.id === subscriberId ? { ...sub, autoRenew: !autoRenew } : sub
        )
      );
      
      Alert.alert(
        'Success',
        `Auto-renewal ${!autoRenew ? 'enabled' : 'disabled'} successfully`
      );
    } catch (error) {
      console.error('Error updating auto-renew:', error);
      Alert.alert('Error', 'Failed to update auto-renewal setting');
    }
  };

  const handleCancelSubscription = async (subscriberId: string, userName: string) => {
    Alert.alert(
      'Confirm Cancellation',
      `Are you sure you want to cancel the subscription for ${userName}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await subscriptionService.cancelSubscription(subscriberId);
              
              // Update local state
              setSubscribers(prev => 
                prev.map(sub => 
                  sub.id === subscriberId ? { ...sub, status: 'cancelled', autoRenew: false } : sub
                )
              );
              
              Alert.alert('Success', 'Subscription cancelled successfully');
            } catch (error) {
              console.error('Error cancelling subscription:', error);
              Alert.alert('Error', 'Failed to cancel subscription');
            }
          }
        }
      ]
    );
  };

  const handleGenerateInvoice = async (subscriberId: string, date: string) => {
    try {
      const invoiceUrl = await subscriptionService.generateInvoice(subscriberId, date);
      
      Alert.alert(
        'Invoice Generated',
        'The invoice has been generated successfully',
        [
          { text: 'OK' },
          {
            text: 'Download',
            onPress: () => {
              // In a real app, this would download or open the invoice
              Alert.alert('Download', `Downloading invoice: ${invoiceUrl}`);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error generating invoice:', error);
      Alert.alert('Error', 'Failed to generate invoice');
    }
  };

  const renderSubscriberItem = ({ item }: { item: Subscriber }) => (
    <View style={styles.subscriberItem}>
      <View style={styles.subscriberInfo}>
        <Text style={styles.subscriberName}>{item.userName}</Text>
        <Text style={styles.subscriberEmail}>{item.userEmail}</Text>
        
        <View style={styles.planInfo}>
          <Text style={styles.planLabel}>Plan:</Text>
          <View style={styles.planBadge}>
            <Text style={styles.planText}>{item.planName}</Text>
          </View>
        </View>
        
        <View style={styles.subscriberMeta}>
          <View style={[
            styles.statusBadge,
            item.status === 'active' ? styles.activeBadge :
            item.status === 'trial' ? styles.trialBadge :
            item.status === 'cancelled' ? styles.cancelledBadge :
            styles.expiredBadge
          ]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
          
          <Text style={styles.dateText}>
            Renews: {item.nextPaymentDate ? new Date(item.nextPaymentDate).toLocaleDateString() : 'N/A'}
          </Text>
        </View>
      </View>
      
      <View style={styles.subscriberActions}>
        <View style={styles.autoRenewContainer}>
          <Text style={styles.autoRenewLabel}>Auto</Text>
          <Switch
            value={item.autoRenew}
            onValueChange={() => handleToggleAutoRenew(item.id, item.autoRenew)}
            trackColor={{ false: '#E1E1E1', true: '#FF6B8A' }}
            thumbColor="#FFFFFF"
            ios_backgroundColor="#E1E1E1"
            disabled={item.status === 'cancelled' || item.status === 'expired'}
          />
        </View>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleGenerateInvoice(item.id, item.startDate)}
        >
          <FileText size={16} color="#666666" />
        </TouchableOpacity>
        
        {item.status === 'active' && (
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => handleCancelSubscription(item.id, item.userName)}
          >
            <X size={16} color="#FF3B30" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={18} color="#999999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search subscribers..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
        </View>
        
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={18} color="#666666" />
        </TouchableOpacity>
      </View>
      
      {showFilters && (
        <View style={styles.filtersContainer}>
          <Text style={styles.filtersTitle}>Filters</Text>
          
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Subscription Status</Text>
            <View style={styles.filterOptions}>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  filters.status === '' && styles.selectedFilterOption
                ]}
                onPress={() => setFilters({ ...filters, status: '' })}
              >
                <Text style={filters.status === '' ? styles.selectedFilterText : styles.filterOptionText}>
                  All
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  filters.status === 'active' && styles.selectedFilterOption
                ]}
                onPress={() => setFilters({ ...filters, status: 'active' })}
              >
                <Text style={filters.status === 'active' ? styles.selectedFilterText : styles.filterOptionText}>
                  Active
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  filters.status === 'trial' && styles.selectedFilterOption
                ]}
                onPress={() => setFilters({ ...filters, status: 'trial' })}
              >
                <Text style={filters.status === 'trial' ? styles.selectedFilterText : styles.filterOptionText}>
                  Trial
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  filters.status === 'cancelled' && styles.selectedFilterOption
                ]}
                onPress={() => setFilters({ ...filters, status: 'cancelled' })}
              >
                <Text style={filters.status === 'cancelled' ? styles.selectedFilterText : styles.filterOptionText}>
                  Cancelled
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.filterGroup}>
            <Text style={styles.filterLabel}>Subscription Plan</Text>
            <View style={styles.filterOptions}>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  filters.planId === '' && styles.selectedFilterOption
                ]}
                onPress={() => setFilters({ ...filters, planId: '' })}
              >
                <Text style={filters.planId === '' ? styles.selectedFilterText : styles.filterOptionText}>
                  All Plans
                </Text>
              </TouchableOpacity>
              
              {plans.map(plan => (
                <TouchableOpacity
                  key={plan.id}
                  style={[
                    styles.filterOption,
                    filters.planId === plan.id && styles.selectedFilterOption
                  ]}
                  onPress={() => setFilters({ ...filters, planId: plan.id })}
                >
                  <Text style={filters.planId === plan.id ? styles.selectedFilterText : styles.filterOptionText}>
                    {plan.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.filterActions}>
            <TouchableOpacity 
              style={styles.resetButton}
              onPress={resetFilters}
            >
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.applyButton}
              onPress={applyFilters}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      <View style={styles.subscriptionSummary}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Active Subscribers</Text>
          <Text style={styles.summaryValue}>115</Text>
        </View>
        
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>MRR</Text>
          <Text style={styles.summaryValue}>$1,897</Text>
        </View>
        
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Retention</Text>
          <Text style={styles.summaryValue}>87%</Text>
        </View>
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B8A" />
          <Text style={styles.loadingText}>Loading subscribers...</Text>
        </View>
      ) : subscribers.length > 0 ? (
        <FlatList
          data={subscribers}
          renderItem={renderSubscriberItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.subscriberList}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={
            pagination.currentPage < pagination.totalPages ? (
              <ActivityIndicator size="small" color="#FF6B8A" style={styles.loadMoreIndicator} />
            ) : null
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <CreditCard size={48} color="#CCCCCC" />
          <Text style={styles.emptyText}>No subscribers found</Text>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: '#333333',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  filterGroup: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterOption: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedFilterOption: {
    backgroundColor: '#FF6B8A',
  },
  filterOptionText: {
    fontSize: 12,
    color: '#666666',
  },
  selectedFilterText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginRight: 8,
  },
  resetButtonText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#FF6B8A',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginLeft: 8,
  },
  applyButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  subscriptionSummary: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
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
  subscriberList: {
    padding: 16,
    paddingTop: 8,
  },
  subscriberItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  subscriberInfo: {
    flex: 1,
  },
  subscriberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  subscriberEmail: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  planInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  planLabel: {
    fontSize: 14,
    color: '#666666',
    marginRight: 8,
  },
  planBadge: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  planText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333333',
  },
  subscriberMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginRight: 8,
  },
  activeBadge: {
    backgroundColor: '#E8F5E9',
  },
  trialBadge: {
    backgroundColor: '#E3F2FD',
  },
  cancelledBadge: {
    backgroundColor: '#FFEBEE',
  },
  expiredBadge: {
    backgroundColor: '#EFEBE9',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333333',
  },
  dateText: {
    fontSize: 12,
    color: '#666666',
  },
  subscriberActions: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  autoRenewContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  autoRenewLabel: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 2,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  cancelButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
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
    marginTop: 16,
  },
  loadMoreIndicator: {
    marginVertical: 16,
  },
});