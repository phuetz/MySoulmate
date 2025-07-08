import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import Voice from '@react-native-community/voice';
import {
  Mic,
  MicOff,
  CirclePause as PauseCircle,
  MessageCircle,
  Heart,
} from 'lucide-react-native';
import { useAppState } from '@/context/AppStateContext';
import PremiumFeatureModal from '@/components/PremiumFeatureModal';
import { useRouter } from 'expo-router';

export default function VoiceScreen() {
  const router = useRouter();
  const { companion, isPremium, updateInteractions } = useAppState();
  const [isRecording, setIsRecording] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [conversation, setConversation] = useState<
    { from: 'user' | 'ai'; text: string }[]
  >([]);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordings, setRecordings] = useState<string[]>([]);
  const transcriptRef = useRef('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Voice.onSpeechResults = (e: any) => {
      if (e.value && e.value[0]) {
        transcriptRef.current = e.value[0];
      }
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  // Mock voice responses for demonstration
  const mockResponses = [
    "I'm so happy to hear your voice today!",
    "That's interesting, tell me more about it.",
    "I've been thinking about you too.",
    'I really enjoy our conversations together.',
    'Your voice always makes my day better.',
  ];

  useEffect(() => {
    if (isRecording) {
      intervalRef.current = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);

        // Simulate AI response every ~10 seconds
        if (timeElapsed > 0 && timeElapsed % 10 === 0) {
          const randomResponse =
            mockResponses[Math.floor(Math.random() * mockResponses.length)];
          setConversation((prev) => [
            ...prev,
            { from: 'ai', text: randomResponse },
          ]);
          Speech.speak(randomResponse);
          updateInteractions(1);
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isRecording, timeElapsed]);

  const startRecording = async () => {
    setTimeElapsed(0);
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') return;
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      setRecording(recording);
      if (Platform.OS !== 'web') {
        transcriptRef.current = '';
        try {
          await Voice.start('en-US');
        } catch (err) {
          console.error('Voice start error', err);
        }
      }
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (uri) setRecordings((prev) => [...prev, uri]);
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
    if (Platform.OS !== 'web') {
      try {
        await Voice.stop();
      } catch (err) {
        console.error('Voice stop error', err);
      }
      const text = transcriptRef.current.trim();
      if (text.length > 0) {
        setConversation((prev) => [...prev, { from: 'user', text }]);
        transcriptRef.current = '';
      }
    }
    setRecording(null);
    setIsRecording(false);
  };

  const playRecording = async (uri: string) => {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri });
      await sound.playAsync();
    } catch (err) {
      console.error('Failed to play audio', err);
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      await stopRecording();
      return;
    }

    if (!isPremium) {
      await startRecording();
      timeoutRef.current = setTimeout(async () => {
        await stopRecording();
        setShowPremiumModal(true);
      }, 15000); // 15 seconds preview
    } else {
      await startRecording();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Voice Chat</Text>
      </View>

      <View style={styles.companionContainer}>
        <Image
          source={{ uri: companion.avatarUrl }}
          style={styles.avatarLarge}
        />
        <Text style={styles.companionName}>{companion.name}</Text>
        <View style={styles.statusContainer}>
          <View
            style={[styles.statusDot, isRecording ? styles.statusActive : {}]}
          />
          <Text style={styles.statusText}>
            {isRecording ? 'Listening...' : 'Ready to talk'}
          </Text>
        </View>
      </View>

      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>{formatTime(timeElapsed)}</Text>
      </View>

      <View style={styles.responsesContainer}>
        {conversation.map((msg, index) => (
          <View
            key={index}
            style={msg.from === 'ai' ? styles.responseItem : styles.userItem}
          >
            {msg.from === 'ai' && (
              <Image
                source={{ uri: companion.avatarUrl }}
                style={styles.responseAvatar}
              />
            )}
            <View
              style={
                msg.from === 'ai'
                  ? styles.responseTextContainer
                  : styles.userTextContainer
              }
            >
              <Text
                style={
                  msg.from === 'ai' ? styles.responseText : styles.userText
                }
              >
                {msg.text}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {recordings.length > 0 && (
        <View style={styles.recordingsContainer}>
          {recordings.map((uri, index) => (
            <TouchableOpacity
              key={index}
              style={styles.recordingItem}
              onPress={() => playRecording(uri)}
            >
              <Text style={styles.recordingText}>Recording {index + 1}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => router.push('/chat')}
        >
          <MessageCircle size={24} color="#9C6ADE" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.recordButton,
            isRecording ? styles.recordingButton : {},
          ]}
          onPress={toggleRecording}
        >
          {isRecording ? (
            <MicOff size={32} color="#FFFFFF" />
          ) : (
            <Mic size={32} color="#FFFFFF" />
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlButton}>
          <Heart size={24} color="#9C6ADE" />
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          {isPremium
            ? 'Premium voice conversations are unlimited'
            : 'Free preview limited to 15 seconds. Upgrade for unlimited voice chats.'}
        </Text>
      </View>

      <PremiumFeatureModal
        visible={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        featureName="Unlimited Voice Chat"
        description="Enjoy unlimited voice conversations with your AI companion."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  companionContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  avatarLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E1E1E1',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  companionName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333333',
    marginTop: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#AAAAAA',
    marginRight: 6,
  },
  statusActive: {
    backgroundColor: '#FF6B8A',
  },
  statusText: {
    fontSize: 14,
    color: '#666666',
  },
  timeContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  timeText: {
    fontSize: 36,
    fontWeight: '300',
    color: '#333333',
    letterSpacing: 1,
  },
  responsesContainer: {
    flex: 1,
    marginTop: 30,
    paddingHorizontal: 20,
  },
  responseItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  responseAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E1E1E1',
    marginRight: 12,
  },
  responseTextContainer: {
    backgroundColor: '#F0F0F0',
    padding: 12,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    maxWidth: '80%',
  },
  userTextContainer: {
    backgroundColor: '#FF6B8A',
    padding: 12,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    maxWidth: '80%',
  },
  responseText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  userText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  recordingsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  recordingItem: {
    backgroundColor: '#ECECEC',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  recordingText: {
    color: '#333333',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    paddingHorizontal: 30,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#9C6ADE',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#9C6ADE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  recordingButton: {
    backgroundColor: '#FF6B8A',
    shadowColor: '#FF6B8A',
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  infoText: {
    fontSize: 13,
    color: '#999999',
    textAlign: 'center',
    paddingHorizontal: 40,
  },});
