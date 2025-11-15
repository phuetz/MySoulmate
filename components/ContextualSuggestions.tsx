import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MessageCircle, Heart, Smile, Calendar, Music, Book } from 'lucide-react-native';

/**
 * Suggestions contextuelles intelligentes
 * Inspiré de Replika - suggestions dynamiques pour l'engagement
 */

interface Suggestion {
  id: string;
  type: 'topic' | 'activity' | 'question';
  title: string;
  icon: React.ReactNode;
  color: string;
}

interface ContextualSuggestionsProps {
  suggestions: Suggestion[];
  onSuggestionPress: (suggestion: Suggestion) => void;
  style?: any;
}

export default function ContextualSuggestions({
  suggestions = [],
  onSuggestionPress,
  style,
}: ContextualSuggestionsProps) {
  if (suggestions.length === 0) return null;

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.header}>Suggestions</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {suggestions.map((suggestion) => (
          <SuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            onPress={() => onSuggestionPress(suggestion)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

function SuggestionCard({ suggestion, onPress }: { suggestion: Suggestion; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: `${suggestion.color}15` }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${suggestion.color}25` }]}>
        {suggestion.icon}
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>
        {suggestion.title}
      </Text>
    </TouchableOpacity>
  );
}

// Exemples de suggestions par défaut
export const DEFAULT_SUGGESTIONS: Suggestion[] = [
  {
    id: '1',
    type: 'question',
    title: 'Comment te sens-tu ?',
    icon: <Smile size={24} color="#FF6B8A" />,
    color: '#FF6B8A',
  },
  {
    id: '2',
    type: 'topic',
    title: 'Parle-moi de toi',
    icon: <MessageCircle size={24} color="#9C6ADE" />,
    color: '#9C6ADE',
  },
  {
    id: '3',
    type: 'activity',
    title: 'Écouter de la musique',
    icon: <Music size={24} color="#4CAF50" />,
    color: '#4CAF50',
  },
  {
    id: '4',
    type: 'topic',
    title: 'Un souvenir spécial',
    icon: <Heart size={24} color="#FF1493" />,
    color: '#FF1493',
  },
  {
    id: '5',
    type: 'activity',
    title: 'Lire une histoire',
    icon: <Book size={24} color="#FFC107" />,
    color: '#FFC107',
  },
];

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  header: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  card: {
    width: 140,
    padding: 12,
    borderRadius: 12,
    marginRight: 12,
    height: 100,
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
    lineHeight: 18,
  },
});
