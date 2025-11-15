import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

/**
 * Réponses rapides contextuelles dans le chat
 * Inspiré de Replika - Suggestions intelligentes pour faciliter la conversation
 */

interface QuickRepliesProps {
  replies: string[];
  onReplyPress: (reply: string) => void;
  visible?: boolean;
}

export default function QuickReplies({ replies, onReplyPress, visible = true }: QuickRepliesProps) {
  if (!visible || replies.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {replies.map((reply, index) => (
          <TouchableOpacity
            key={index}
            style={styles.replyChip}
            onPress={() => onReplyPress(reply)}
            activeOpacity={0.7}
          >
            <Text style={styles.replyText}>{reply}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  replyChip: {
    backgroundColor: '#F0E6FF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#9C6ADE',
  },
  replyText: {
    fontSize: 14,
    color: '#9C6ADE',
    fontWeight: '500',
  },
});
