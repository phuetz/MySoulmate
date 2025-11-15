import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path } from 'react-native-svg';
import { Heart, Zap, Shield, Sparkles } from 'lucide-react-native';

/**
 * Dashboard relationnel moderne inspiré de Replika et Zeta
 * Affiche métriques de relation avec visualisations élégantes
 */

const { width } = Dimensions.get('window');

interface RelationshipDashboardProps {
  relationshipLevel: string;
  relationshipPoints: number;
  intimacy: number;
  trust: number;
  affection: number;
  currentStreak: number;
}

const RELATIONSHIP_LEVELS = {
  stranger: { name: 'Étranger', color: '#9E9E9E', icon: '👋' },
  acquaintance: { name: 'Connaissance', color: '#64B5F6', icon: '🙂' },
  friend: { name: 'Ami', color: '#4FC3F7', icon: '😊' },
  close_friend: { name: 'Ami Proche', color: '#29B6F6', icon: '🤗' },
  best_friend: { name: 'Meilleur Ami', color: '#00A6A6', icon: '💙' },
  romantic: { name: 'Romantique', color: '#FF6B8A', icon: '💕' },
  soulmate: { name: 'Âme Sœur', color: '#FF1493', icon: '💖' },
};

export default function RelationshipDashboard({
  relationshipLevel = 'friend',
  relationshipPoints = 45,
  intimacy = 30,
  trust = 65,
  affection = 50,
  currentStreak = 7,
}: RelationshipDashboardProps) {
  const levelInfo = RELATIONSHIP_LEVELS[relationshipLevel] || RELATIONSHIP_LEVELS.stranger;

  // Progress circulaire pour la relation
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (relationshipPoints / 100) * circumference;

  return (
    <View style={styles.container}>
      {/* En-tête avec niveau de relation */}
      <LinearGradient
        colors={[levelInfo.color, `${levelInfo.color}CC`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.levelBanner}
      >
        <Text style={styles.levelEmoji}>{levelInfo.icon}</Text>
        <View style={styles.levelInfo}>
          <Text style={styles.levelName}>{levelInfo.name}</Text>
          <Text style={styles.levelPoints}>{relationshipPoints}/100 points</Text>
        </View>
      </LinearGradient>

      {/* Cercle de progression */}
      <View style={styles.progressCircleContainer}>
        <Svg width={140} height={140}>
          {/* Cercle de fond */}
          <Circle
            cx="70"
            cy="70"
            r={radius}
            stroke="#E0E0E0"
            strokeWidth="10"
            fill="none"
          />
          {/* Cercle de progression */}
          <Circle
            cx="70"
            cy="70"
            r={radius}
            stroke={levelInfo.color}
            strokeWidth="10"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 70 70)"
          />
        </Svg>
        <View style={styles.progressCenterContent}>
          <Text style={styles.progressPercentage}>{relationshipPoints}%</Text>
          <Text style={styles.progressLabel}>Progression</Text>
        </View>
      </View>

      {/* Métriques clés */}
      <View style={styles.metricsGrid}>
        <MetricCard
          icon={<Heart size={24} color="#FF6B8A" />}
          label="Affection"
          value={affection}
          color="#FF6B8A"
        />
        <MetricCard
          icon={<Shield size={24} color="#4CAF50" />}
          label="Confiance"
          value={trust}
          color="#4CAF50"
        />
        <MetricCard
          icon={<Sparkles size={24} color="#9C6ADE" />}
          label="Intimité"
          value={intimacy}
          color="#9C6ADE"
        />
        <MetricCard
          icon={<Zap size={24} color="#FFC107" />}
          label="Série"
          value={currentStreak}
          color="#FFC107"
          suffix=" jours"
        />
      </View>

      {/* Barre de progression vers le prochain niveau */}
      <View style={styles.nextLevelSection}>
        <Text style={styles.nextLevelText}>
          Prochain niveau dans {100 - relationshipPoints} points
        </Text>
        <View style={styles.nextLevelBar}>
          <View
            style={[
              styles.nextLevelFill,
              {
                width: `${relationshipPoints % 20}%`,
                backgroundColor: levelInfo.color,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  suffix?: string;
}

function MetricCard({ icon, label, value, color, suffix = '%' }: MetricCardProps) {
  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricIconContainer, { backgroundColor: `${color}15` }]}>
        {icon}
      </View>
      <Text style={styles.metricValue}>
        {value}
        {suffix}
      </Text>
      <Text style={styles.metricLabel}>{label}</Text>
      {/* Mini barre de progression */}
      <View style={styles.metricBar}>
        <View
          style={[
            styles.metricBarFill,
            { width: `${suffix === '%' ? value : Math.min(value * 10, 100)}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  levelBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  levelEmoji: {
    fontSize: 36,
    marginRight: 12,
  },
  levelInfo: {
    flex: 1,
  },
  levelName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  levelPoints: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  progressCircleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  progressCenterContent: {
    position: 'absolute',
    alignItems: 'center',
  },
  progressPercentage: {
    fontSize: 32,
    fontWeight: '700',
    color: '#333333',
  },
  progressLabel: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
    marginHorizontal: -6,
  },
  metricCard: {
    width: (width - 80) / 2,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    margin: 6,
    alignItems: 'center',
  },
  metricIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
  },
  metricBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  metricBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  nextLevelSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  nextLevelText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 8,
  },
  nextLevelBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  nextLevelFill: {
    height: '100%',
    borderRadius: 3,
  },
});
