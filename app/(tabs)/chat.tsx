import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { Smile, Image as ImageIcon, Send, Mic, MoreVertical } from 'lucide-react-native';
import { useAppState } from '@/context/AppStateContext';
import PremiumFeatureModal from '@/components/PremiumFeatureModal';
import EmojiPicker from '@/components/EmojiPicker';
import { generateAIResponse } from '@/utils/aiUtils';
import OfflineBanner from '@/components/OfflineBanner';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export default function ChatScreen() {
  const { companion, updateInteractions, isPremium } = useAppState();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNSFWModal, setShowNSFWModal] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [emojiPickerVisible, setEmojiPickerVisible] = useState(false);
  const [reactionPickerVisible, setReactionPickerVisible] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const { isConnected } = useNetworkStatus();

  useEffect(() => {
    if (!isPremium && companion.interactions >= 20) {
      setShowUpgradeModal(true);
    }
  }, [companion.interactions, isPremium]);

  const filteredMessages = messages.filter((m) =>
    m.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const loadMessages = async () => {
      const stored = await AsyncStorage.getItem('chatMessages');
      if (stored) {
        setMessages(JSON.parse(stored));
      } else {
        const initialMessage = {
          id: '1',
          text: `Hello there! I'm ${companion.name}. How are you doing today?`,
          isUser: false,
          timestamp: new Date(),
        };
        setMessages([initialMessage]);
      }
    };
    loadMessages();
  }, [companion.name]);

  useEffect(() => {
    AsyncStorage.setItem('chatMessages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    const syncOffline = async () => {
      if (isConnected !== true) return;
      const stored = await AsyncStorage.getItem('offlineMessages');
      if (!stored) return;
      const queue = JSON.parse(stored);
      for (const msg of queue) {
        await processAIResponse(msg);
      }
      await AsyncStorage.removeItem('offlineMessages');
    };
    syncOffline();
  }, [isConnected]);

  const processAIResponse = async (msg: { id: string; text: string }) => {
    setIsTyping(true);
    const history = [...messages, msg]
      .slice(-5)
      .filter(m => typeof m.text === 'string')
      .map(m => ({ role: m.isUser ? 'user' : 'assistant', content: m.text }));
    const response = await generateAIResponse(msg.text, companion, history);
    const aiMessage = {
      id: (Date.now() + 1).toString(),
      text: response,
      isUser: false,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, aiMessage]);
    setIsTyping(false);
  };

  const handleSend = async () => {
    if (message.trim() === '') return;

    const userMessage = {
      id: Date.now().toString(),
      text: message,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    setMessage('');
    updateInteractions(1);

    if (isConnected === false) {
      const stored = await AsyncStorage.getItem('offlineMessages');
      const queue = stored ? JSON.parse(stored) : [];
      queue.push(userMessage);
      await AsyncStorage.setItem('offlineMessages', JSON.stringify(queue));
      return;
    }

    setTimeout(() => processAIResponse(userMessage), 1000 + Math.random() * 2000);
  };

  const handleNSFWRequest = () => {
    if (isPremium) {
      // Allow NSFW content
      // This is where you'd implement the NSFW content generation
      const userMessage = {
        id: Date.now().toString(),
        text: "Can we talk about something more intimate?",
        isUser: true,
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      
      // Simulate AI responding with NSFW content
      setIsTyping(true);
      setTimeout(() => {
        const aiMessage = {
          id: (Date.now() + 1).toString(),
          text: "I'd love to explore that with you. What did you have in mind? [NSFW content would appear here for premium users]",
          isUser: false,
          timestamp: new Date(),
        };
        setMessages((prevMessages) => [...prevMessages, aiMessage]);
        setIsTyping(false);
      }, 1500);
    } else {
      setShowNSFWModal(true);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setEmojiPickerVisible(false);
  };

  const handleAddReaction = (emoji: string) => {
    if (!selectedMessageId) return;
    setMessages(prev =>
      prev.map(msg =>
        msg.id === selectedMessageId
          ? { ...msg, reactions: [...(msg.reactions || []), emoji] }
          : msg
      )
    );
    setReactionPickerVisible(false);
    setSelectedMessageId(null);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7
    });
    if (!result.canceled && result.assets.length > 0) {
      const imageMessage = {
        id: Date.now().toString(),
        image: result.assets[0].uri,
        isUser: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, imageMessage]);
      updateInteractions(1);
    }
  };

  const startRecording = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') return;
    try {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    const recording = recordingRef.current;
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setIsRecording(false);
      recordingRef.current = null;
      if (uri) {
        const audioMessage = {
          id: Date.now().toString(),
          audio: uri,
          isUser: true,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, audioMessage]);
        updateInteractions(1);
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };

  const playAudio = async (uri: string) => {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri });
      await sound.playAsync();
    } catch (err) {
      console.error('Failed to play audio', err);
    }
  };

  const renderMessageItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onLongPress={() => {
        setSelectedMessageId(item.id);
        setReactionPickerVisible(true);
      }}
    >
      <View style={[styles.messageBubble, item.isUser ? styles.userBubble : styles.companionBubble]}>
        {!item.isUser && (
          <Image
            source={{ uri: companion.avatarUrl }}
            style={styles.messageBubbleAvatar}
          />
        )}
        <View style={[styles.messageContent, item.isUser ? styles.userContent : styles.companionContent]}>
          {item.image && (
            <Image source={{ uri: item.image }} style={styles.attachmentImage} />
          )}
          {item.audio && (
            <TouchableOpacity onPress={() => playAudio(item.audio)} style={styles.audioButton}>
              <Text style={styles.audioButtonText}>Play Audio</Text>
            </TouchableOpacity>
          )}
          {item.text !== undefined && (
            <Text style={[styles.messageText, item.isUser ? styles.userText : styles.companionText]}>
              {item.text}
            </Text>
          )}
          <Text style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {item.reactions && item.reactions.length > 0 && (
            <View style={styles.reactionsContainer}>
              {item.reactions.map((r: string, idx: number) => (
                <Text key={idx} style={styles.reaction}>{r}</Text>
              ))}
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={80}
    >
      <LinearGradient
        colors={['#FF6B8A', '#9C6ADE']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: companion.avatarUrl }}
              style={styles.avatar}
            />
            <View style={styles.onlineIndicator} />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{companion.name}</Text>
            {isTyping ? (
              <View style={styles.typingContainer}>
                <View style={styles.typingDot} />
                <View style={[styles.typingDot, styles.typingDot2]} />
                <View style={[styles.typingDot, styles.typingDot3]} />
                <Text style={styles.typingIndicator}>typing...</Text>
              </View>
            ) : (
              <Text style={styles.status}>Active now</Text>
            )}
          </View>
          <TouchableOpacity style={styles.moreButton}>
            <MoreVertical size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      <OfflineBanner isConnected={isConnected} />

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search messages..."
          placeholderTextColor="#999999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        ref={flatListRef}
        data={filteredMessages}
        renderItem={renderMessageItem}
        keyExtractor={(item) => item.id}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        onContentSizeChange={() => {
          if (flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: true });
          }
        }}
        onLayout={() => {
          if (flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: true });
          }
        }}
      />

      <View style={styles.inputContainer}>
        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.inputButton} onPress={pickImage}>
            <ImageIcon size={24} color="#9C6ADE" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.inputButton} onPress={isRecording ? stopRecording : startRecording}>
            <Mic size={24} color={isRecording ? '#FF6B8A' : '#9C6ADE'} />
          </TouchableOpacity>
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.input}
              value={message}
              onChangeText={setMessage}
              placeholder="Type a message..."
              placeholderTextColor="#999999"
              multiline
            />
            <TouchableOpacity style={styles.inputAttachment} onPress={() => setEmojiPickerVisible(true)}>
              <Smile size={24} color="#9C6ADE" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[
              styles.sendButton,
              message.trim() && isConnected !== false ? styles.sendButtonActive : {}
            ]}
            onPress={handleSend}
            disabled={!message.trim() || isConnected === false}
          >
            <Send size={24} color={message.trim() && isConnected !== false ? "#FFFFFF" : "#BBBBBB"} />
          </TouchableOpacity>
        </View>

        <View style={styles.chatExtras}>
          <TouchableOpacity style={styles.nsfw} onPress={handleNSFWRequest}>
            <Text style={styles.nsfwText}>NSFW Mode</Text>
          </TouchableOpacity>
        </View>
      </View>

      <PremiumFeatureModal
        visible={showNSFWModal}
        onClose={() => setShowNSFWModal(false)}
        featureName="NSFW Content"
        description="Unlock intimate conversations and NSFW content with your AI companion."
      />
      <PremiumFeatureModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName="Premium Membership"
        description="You've reached the interaction limit for free users. Upgrade to continue without restrictions."
      />
      <EmojiPicker
        visible={emojiPickerVisible}
        onSelect={handleEmojiSelect}
        onClose={() => setEmojiPickerVisible(false)}
      />
      <EmojiPicker
        visible={reactionPickerVisible}
        onSelect={handleAddReaction}
        onClose={() => setReactionPickerVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: '#E1E1E1',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 14,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  status: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginRight: 4,
    opacity: 0.7,
  },
  typingDot2: {
    opacity: 0.5,
  },
  typingDot3: {
    opacity: 0.3,
  },
  typingIndicator: {
    fontSize: 13,
    color: '#FFFFFF',
    fontStyle: 'italic',
    marginLeft: 6,
    opacity: 0.9,
  },
  moreButton: {
    padding: 8,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    backgroundColor: '#F5F7FA',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333333',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 20,
    paddingTop: 12,
  },
  messageBubble: {
    marginBottom: 20,
    maxWidth: '75%',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  userBubble: {
    alignSelf: 'flex-end',
  },
  companionBubble: {
    alignSelf: 'flex-start',
  },
  messageBubbleAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 10,
    backgroundColor: '#E1E1E1',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  messageContent: {
    padding: 14,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  userContent: {
    backgroundColor: '#FF6B8A',
    borderBottomRightRadius: 6,
  },
  companionContent: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
  },
  companionText: {
    color: '#333333',
  },
  timestamp: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    alignSelf: 'flex-end',
    marginTop: 6,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 12,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  inputButton: {
    padding: 10,
    backgroundColor: '#F5F7FA',
    borderRadius: 20,
    marginRight: 8,
  },
  textInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F5F7FA',
    borderRadius: 24,
    paddingHorizontal: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    maxHeight: 100,
    paddingTop: 12,
    paddingBottom: 12,
    paddingRight: 8,
    color: '#333333',
  },
  inputAttachment: {
    padding: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sendButtonActive: {
    backgroundColor: '#FF6B8A',
    shadowColor: '#FF6B8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  chatExtras: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    marginBottom: 4,
  },
  nsfw: {
    padding: 4,
  },
  nsfwText: {
    fontSize: 12,
    color: '#FF6B8A',
    fontWeight: '500',
  },
  reactionsContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  reaction: {
    marginRight: 4,
    fontSize: 16,
  },
  attachmentImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
  audioButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#9C6ADE',
    borderRadius: 8,
    marginBottom: 8,
  },
  audioButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
});
