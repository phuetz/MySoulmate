import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Users, Package, Tag, CreditCard, BarChart2, Clock, Calendar, UserPlus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import StatCard from '@/components/admin/StatCard';
import ActivityLog from '@/components/admin/ActivityLog';

export default function AdminDashboard() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    users: 132,
    products: 87,
    categories: 12,
    revenue: 4293.45,
  });

  const [recentActivities, setRecentActivities] = useState([
    {
      id: '1',
      action: 'created a new product',
      user: 'John Doe',
      timestamp: '10 minutes ago',
      type: 'success',
      entity: 'Premium Subscription',
    },
    {
      id: '2',
      action: 'updated category',
      user: 'Jane Smith',
      timestamp: '1 hour ago',
      type: 'info',
      entity: 'Electronics',
    },
    {
      id: '3',
      action: 'deleted a product',
      user: 'Admin',
      timestamp: '3 hours ago',
      type: 'warning',
      entity: 'Old Plan',
    },
    {
      id: '4',
      action: 'updated user permissions',
      user: 'Admin',
      timestamp: 'Yesterday',
      type: 'info',
      entity: 'support@example.com',
    },
  ]);

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        data: [30, 45, 28, 80, 99, 43],
        color: (opacity = 1) => `rgba(255, 107, 138, ${opacity})`,
        strokeWidth: 2
      }
    ],
    legend: ['Sales Revenue']
  };

  const chartConfig = {
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(156, 106, 222, ${opacity})`,
    style: {
      borderRadius: 16
    }
  };

  const screenWidth = Dimensions.get('window').width - 32;

  const onRefresh = async () => {
    setRefreshing(true);
    
    // Simulate data fetching
    setTimeout(() => {
      setStats({
        users: 134,
        products: 89,
        categories: 12,
        revenue: 4512.78,
      });
      setRefreshing(false);
    }, 1500);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.statsContainer}>
        <StatCard
          title="Total Users"
          value={stats.users}
          icon={Users}
          iconColor="#FF6B8A"
          iconBgColor="#FFF0F3"
          percentChange={3.2}
        />
        
        <StatCard
          title="Products"
          value={stats.products}
          icon={Package}
          iconColor="#9C6ADE"
          iconBgColor="#F3F0FF"
          percentChange={1.5}
        />
        
        <StatCard
          title="Categories"
          value={stats.categories}
          icon={Tag}
          iconColor="#4CAF50"
          iconBgColor="#E8F5E9"
          percentChange={0}
        />
        
        <StatCard
          title="Revenue"
          value={`$${stats.revenue.toFixed(2)}`}
          icon={CreditCard}
          iconColor="#2196F3"
          iconBgColor="#E3F2FD"
          percentChange={5.1}
        />
      </View>

      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Sales Overview</Text>
          <View style={styles.chartActions}>
            <TouchableOpacity style={[styles.periodButton, styles.activePeriodButton]}>
              <Text style={styles.activePeriodButtonText}>Monthly</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.periodButton}>
              <Text style={styles.periodButtonText}>Yearly</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <LineChart
          data={chartData}
          width={screenWidth}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/admin/products/create')}
          >
            <View style={[styles.actionIcon, styles.productIcon]}>
              <Package size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.actionText}>Add Product</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/admin/categories/create')}
          >
            <View style={[styles.actionIcon, styles.categoryIcon]}>
              <Tag size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.actionText}>Add Category</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/admin/users/create')}
          >
            <View style={[styles.actionIcon, styles.userIcon]}>
              <UserPlus size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.actionText}>Add User</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ActivityLog activities={recentActivities} />

      <View style={styles.summaryContainer}>
        <View style={styles.summaryHeader}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <TouchableOpacity onPress={() => router.push('/admin/analytics')}>
            <Text style={styles.viewAllLink}>View Full Report</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.summaryCards}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIconContainer}>
              <Clock size={20} color="#FF6B8A" />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryTitle}>Paid Subscribers</Text>
              <Text style={styles.summaryValue}>87%</Text>
              <Text style={styles.summaryDescription}>Retention rate</Text>
            </View>
          </View>
          
          <View style={styles.summaryCard}>
            <View style={styles.summaryIconContainer}>
              <Calendar size={20} color="#9C6ADE" />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryTitle}>Premium Subscriptions</Text>
              <Text style={styles.summaryValue}>+12.5%</Text>
              <Text style={styles.summaryDescription}>Monthly growth</Text>
            </View>
          </View>
          
          <View style={styles.summaryCard}>
            <View style={styles.summaryIconContainer}>
              <BarChart2 size={20} color="#2196F3" />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryTitle}>User Engagement</Text>
              <Text style={styles.summaryValue}>23 min</Text>
              <Text style={styles.summaryDescription}>Average session time</Text>
            </View>
          </View>
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
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  chartActions: {
    flexDirection: 'row',
  },
  periodButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 16,
    marginLeft: 8,
  },
  activePeriodButton: {
    backgroundColor: '#FFF0F3',
  },
  periodButtonText: {
    fontSize: 12,
    color: '#666666',
  },
  activePeriodButtonText: {
    fontSize: 12,
    color: '#FF6B8A',
    fontWeight: '500',
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  quickActions: {
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    margin: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  productIcon: {
    backgroundColor: '#FF6B8A',
  },
  categoryIcon: {
    backgroundColor: '#9C6ADE',
  },
  userIcon: {
    backgroundColor: '#2196F3',
  },
  actionText: {
    fontSize: 12,
    color: '#333333',
    fontWeight: '500',
  },
  summaryContainer: {
    marginTop: 8,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewAllLink: {
    fontSize: 12,
    color: '#FF6B8A',
    fontWeight: '500',
  },
  summaryCards: {
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  summaryContent: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 2,
  },
  summaryDescription: {
    fontSize: 12,
    color: '#999999',
  },
});