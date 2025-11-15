import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { X, Send } from 'lucide-react-native';
import VoiceInputButton from './VoiceInputButton';

/**
 * Overlay d'enregistrement vocal en plein écran
 * Inspiré de WhatsApp et Telegram
 */

const { width, height } = Dimensions.get('window');

interface VoiceRecordingOverlayProps {
  visible: boolean;
  isRecording: boolean;
  onClose: () => void;
  onSend: () => void;
  onToggleRecording: () => void;
}

export default function VoiceRecordingOverlay({
  visible,
  isRecording,
  onClose,
  onSend,
  onToggleRecording,
}: VoiceRecordingOverlayProps) {
  const [duration, setDuration] = useState(0);
  const [waveformHeights] = useState(() =>
    Array.from({ length: 50 }, () => Math.random())
  );

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setDuration(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <X size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {isRecording ? 'Enregistrement...' : 'Message vocal'}
            </Text>
            <View style={styles.placeholder} />
          </View>

          {/* Waveform visualization */}
          <View style={styles.waveformContainer}>
            <View style={styles.waveform}>
              {waveformHeights.map((height, index) => {
                const animatedHeight = isRecording
                  ? height * 150 + Math.random() * 20
                  : height * 100;
                return (
                  <View
                    key={index}
                    style={[
                      styles.waveformBar,
                      {
                        height: animatedHeight,
                        backgroundColor: isRecording
                          ? '#FF6B8A'
                          : 'rgba(255, 107, 138, 0.5)',
                      },
                    ]}
                  />
                );
              })}
            </View>
          </View>

          {/* Duration */}
          <Text style={styles.duration}>{formatDuration(duration)}</Text>

          {/* Controls */}
          <View style={styles.controls}>
            <VoiceInputButton
              isRecording={isRecording}
              onPress={onToggleRecording}
              size={80}
            />
          </View>

          {/* Send button */}
          {duration > 0 && !isRecording && (
            <TouchableOpacity
              style={styles.sendButton}
              onPress={onSend}
              activeOpacity={0.8}
            >
              <Send size={24} color="#FFFFFF" />
              <Text style={styles.sendButtonText}>Envoyer</Text>
            </TouchableOpacity>
          )}

          {/* Instructions */}
          <Text style={styles.instructions}>
            {isRecording
              ? 'Appuyez pour arrêter l\'enregistrement'
              : duration > 0
              ? 'Appuyez sur Envoyer ou réenregistrez'
              : 'Appuyez pour commencer l\'enregistrement'}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.9,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 40,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 44,
  },
  waveformContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 200,
  },
  waveformBar: {
    width: 4,
    borderRadius: 2,
    marginHorizontal: 2,
  },
  duration: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 40,
    fontVariant: ['tabular-nums'],
  },
  controls: {
    marginBottom: 30,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 20,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  sendButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  instructions: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
});
