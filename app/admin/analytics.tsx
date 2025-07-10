import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { Calendar, Users, ShoppingBag, CreditCard, Video } from 'lucide-react-native';
import { useAppState } from '@/context/AppStateContext';

export default function AnalyticsScreen() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const screenWidth = Dimensions.get('window').width - 32;
  const { companion } = useAppState();
  const totalVideoMinutes = Math.floor(
    (companion.videoCallHistory?.reduce((sum, call) => sum + call.duration, 0) || 0) / 60
  );

  const revenueData = {
    week: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          data: [500, 700, 480, 520, 610, 750, 810],
          color: (opacity = 1) => `rgba(255, 107, 138, ${opacity})`,
          strokeWidth: 2
        }
      ],
      legend: ['Weekly Revenue']
    },
    month: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      datasets: [
        {
          data: [2400, 1980, 2100, 2540],
          color: (opacity = 1) => `rgba(255, 107, 138, ${opacity})`,
          strokeWidth: 2
        }
      ],
      legend: ['Monthly Revenue']
    },
    year: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [
        {
          data: [4500, 4200, 3800, 4100, 4600, 4300, 4800, 5100, 4900, 5200, 5800, 6100],
          color: (opacity = 1) => `rgba(255, 107, 138, ${opacity})`,
          strokeWidth: 2
        }
      ],
      legend: ['Yearly Revenue']
    }
  };

  const userSignupsData = {
    labels: ['Free', 'Basic', 'Premium'],
    data: [20, 45, 35],
    colors: ['#FF6B8A', '#9C6ADE', '#4285F4'],
    legend: ['Free Users', 'Basic Subscribers', 'Premium Subscribers']
  };

  const productSalesData = {
    labels: ['Electronics', 'Clothing', 'Books', 'Other'],
    datasets: [
      {
        data: [35, 28, 15, 22]
      }
    ]
  };

  const chartConfig = {
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(156, 106, 222, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16
    }
  };

  const pieChartConfig = {
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    decimalPlaces: 0,
    color: (opacity = 1, _index) => `rgba(0, 0, 0, ${opacity})`,
  };

  const renderTimeRangeSelector = () => (
    <View style={styles.timeRangeSelector}>
      <TouchableOpacity 
        style={[styles.timeRangeButton, timeRange === 'week' && styles.activeTimeRange]}
        onPress={() => setTimeRange('week')}
      >
        <Text style={[styles.timeRangeText, timeRange === 'week' && styles.activeTimeRangeText]}>
          Week
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.timeRangeButton, timeRange === 'month' && styles.activeTimeRange]}
        onPress={() => setTimeRange('month')}
      >
        <Text style={[styles.timeRangeText, timeRange === 'month' && styles.activeTimeRangeText]}>
          Month
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.timeRangeButton, timeRange === 'year' && styles.activeTimeRange]}
        onPress={() => setTimeRange('year')}
      >
        <Text style={[styles.timeRangeText, timeRange === 'year' && styles.activeTimeRangeText]}>
          Year
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Analytics Dashboard</Text>
        <View style={styles.dateRangeContainer}>
          <Calendar size={16} color="#666666" />
          <Text style={styles.dateRangeText}>
            {timeRange === 'week' ? 'Last 7 days' : 
             timeRange === 'month' ? 'Last 30 days' : 'Year to date'}
          </Text>
        </View>
      </View>

      <View style={styles.statsSummary}>
        <View style={styles.statCard}>
          <Users size={24} color="#FF6B8A" />
          <Text style={styles.statValue}>134</Text>
          <Text style={styles.statLabel}>Users</Text>
        </View>
        
        <View style={styles.statCard}>
          <ShoppingBag size={24} color="#9C6ADE" />
          <Text style={styles.statValue}>89</Text>
          <Text style={styles.statLabel}>Products</Text>
        </View>
        
        <View style={styles.statCard}>
          <CreditCard size={24} color="#4CAF50" />
          <Text style={styles.statValue}>$4.5k</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
        <View style={styles.statCard}>
          <Video size={24} color="#4285F4" />
          <Text style={styles.statValue}>{totalVideoMinutes}m</Text>
          <Text style={styles.statLabel}>Video Calls</Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Revenue</Text>
          {renderTimeRangeSelector()}
        </View>
        
        <LineChart
          data={revenueData[timeRange]}
          width={screenWidth}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
        />
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>User Distribution</Text>
        <PieChart
          data={userSignupsData.data.map((value, index) => ({
            value,
            name: userSignupsData.labels[index],
            color: userSignupsData.colors[index],
            legendFontColor: '#7F7F7F',
            legendFontSize: 13
          }))}
          width={screenWidth}
          height={200}
          chartConfig={pieChartConfig}
          accessor="value"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Product Sales by Category</Text>
        <BarChart
          data={productSalesData}
          width={screenWidth}
          height={220}
          chartConfig={{
            ...chartConfig,
            color: (opacity = 1) => `rgba(156, 106, 222, ${opacity})`
          }}
          style={styles.chart}
        />
      </View>
      
      <View style={styles.insightsContainer}>
        <Text style={styles.insightsTitle}>Key Insights</Text>
        <View style={styles.insightCard}>
          <Text style={styles.insightText}>
            Premium subscriptions have increased by 12.5% compared to the previous month.
          </Text>
        </View>
        <View style={styles.insightCard}>
          <Text style={styles.insightText}>
            The Electronics category generates the highest revenue with an average of $54 per order.
          </Text>
        </View>
        <View style={styles.insightCard}>
          <Text style={styles.insightText}>
            User retention rate is at 87%, which is 5% higher than the industry average.
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
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 8,
  },
  dateRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateRangeText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
  },
  statsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
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
    marginBottom: 16,
  },
  timeRangeSelector: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    padding: 2,
  },
  timeRangeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 18,
  },
  activeTimeRange: {
    backgroundColor: '#FF6B8A',
  },
  timeRangeText: {
    fontSize: 12,
    color: '#666666',
  },
  activeTimeRangeText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  insightsContainer: {
    marginBottom: 20,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  insightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  insightText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
});