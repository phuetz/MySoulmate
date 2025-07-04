import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { LucideIcon } from 'lucide-react-native';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  percentChange?: number;
  comparison?: string;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  iconColor = '#FF6B8A',
  iconBgColor = '#FFF0F3',
  percentChange,
  comparison = 'vs last month'
}: StatCardProps) {
  const isPositiveChange = percentChange && percentChange > 0;
  
  return (
    <View style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
        <Icon size={24} color={iconColor} />
      </View>
      
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.value}>{value}</Text>
      
      {percentChange !== undefined && (
        <View style={styles.comparisonContainer}>
          <Text 
            style={[
              styles.percentChange, 
              isPositiveChange ? styles.positiveChange : styles.negativeChange
            ]}
          >
            {isPositiveChange ? '+' : ''}{percentChange}%
          </Text>
          <Text style={styles.comparisonText}>{comparison}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    flex: 1,
    minWidth: '48%',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 6,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 8,
  },
  comparisonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  percentChange: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  positiveChange: {
    color: '#4CAF50',
  },
  negativeChange: {
    color: '#FF3B30',
  },
  comparisonText: {
    fontSize: 12,
    color: '#999999',
  },
});