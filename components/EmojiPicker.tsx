import React from 'react';
import { Modal, View, FlatList, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface EmojiPickerProps {
  visible: boolean;
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const EMOJIS = ['😀','😂','😍','😢','👍','🎉','🙏','😎','🎂','❤️'];

export default function EmojiPicker({ visible, onSelect, onClose }: EmojiPickerProps) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <FlatList
            data={EMOJIS}
            keyExtractor={(item) => item}
            numColumns={5}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => onSelect(item)} style={styles.emojiButton}>
                <Text style={styles.emoji}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
  },
  emojiButton: {
    padding: 6,
  },
  emoji: {
    fontSize: 24,
  },
});
