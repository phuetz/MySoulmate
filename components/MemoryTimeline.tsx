import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Calendar, Heart, Star, MessageCircle, Gift, User } from 'lucide-react-native';

/**
 * Timeline des mémoires inspirée de Replika
 * Affiche chronologiquement les moments importants
 */

interface Memory {
  id: string;
  type: 'fact' | 'preference' | 'event' | 'emotion' | 'conversation';
  content: string;
  importance: number;
  emotionalWeight: number;
  createdAt: Date;
  category?: string;
}

interface MemoryTimelineProps {
  memories: Memory[];
  onMemoryPress?: (memory: Memory) => void;
}

const MEMORY_ICONS = {
  fact: User,
  preference: Star,
  event: Calendar,
  emotion: Heart,
  conversation: MessageCircle,
};

const MEMORY_COLORS = {
  fact: '#2196F3',
  preference: '#FFD700',
  event: '#4CAF50',
  emotion: '#FF6B8A',
  conversation: '#9C6ADE',
};

export default function MemoryTimeline({ memories = [], onMemoryPress }: MemoryTimelineProps) {
  const sortedMemories = [...memories].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Souvenirs Partagés</Text>
      <View style={styles.timeline}>
        {sortedMemories.map((memory, index) => (
          <MemoryItem
            key={memory.id}
            memory={memory}
            isLast={index === sortedMemories.length - 1}
            onPress={() => onMemoryPress?.(memory)}
          />
        ))}
        {sortedMemories.length === 0 && (
          <Text style={styles.emptyText}>Aucun souvenir encore... Parlez davantage !</Text>
        )}
      </View>
    </ScrollView>
  );
}

function MemoryItem({ memory, isLast, onPress }: { memory: Memory; isLast: boolean; onPress: () => void }) {
  const Icon = MEMORY_ICONS[memory.type] || User;
  const color = MEMORY_COLORS[memory.type] || '#9E9E9E';

  return (
    <TouchableOpacity style={styles.memoryItem} onPress={onPress} activeOpacity={0.7}>
      {/* Timeline line */}
      {!isLast && <View style={styles.timelineLine} />}

      {/* Icon */}
      <View style={[styles.iconContainer, { backgroundColor: `${color}20`, borderColor: color }]}>
        <Icon size={20} color={color} />
      </View>

      {/* Content */}
      <View style={styles.memoryContent}>
        <View style={styles.memoryHeader}>
          <Text style={styles.memoryDate}>
            {new Date(memory.createdAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </Text>
          <View style={styles.importanceContainer}>
            {Array.from({ length: Math.min(memory.importance, 5) }).map((_, i) => (
              <Star key={i} size={12} color="#FFD700" fill="#FFD700" />
            ))}
          </View>
        </View>
        <Text style={styles.memoryText}>{memory.content}</Text>
        {memory.category && (
          <View style={[styles.categoryBadge, { backgroundColor: `${color}15` }]}>
            <Text style={[styles.categoryText, { color }]}>{memory.category}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 20,
  },
  timeline: {
    paddingLeft: 8,
  },
  memoryItem: {
    flexDirection: 'row',
    marginBottom: 20,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 19,
    top: 40,
    bottom: -20,
    width: 2,
    backgroundColor: '#E0E0E0',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    backgroundColor: '#FFFFFF',
  },
  memoryContent: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 12,
  },
  memoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  memoryDate: {
    fontSize: 12,
    color: '#999999',
    fontWeight: '500',
  },
  importanceContainer: {
    flexDirection: 'row',
  },
  memoryText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
    marginBottom: 8,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    marginTop: 20,
  },
});
