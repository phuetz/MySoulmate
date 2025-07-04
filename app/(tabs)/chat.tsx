import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { ArrowUp, Smile, Image as ImageIcon, CirclePlus as PlusCircle, Send } from 'lucide-react-native';
import { useAppState } from '@/context/AppStateContext';
import PremiumFeatureModal from '@/components/PremiumFeatureModal';
import { generateAIResponse } from '@/utils/aiUtils';

export default function ChatScreen() {
  const { companion, updateInteractions, isPremium } = useAppState();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [showNSFWModal, setShowNSFWModal] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length === 0) {
      // Add initial greeting message
      const initialMessage = {
        id: '1',
        text: `Hello there! I'm ${companion.name}. How are you doing today?`,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages([initialMessage]);
    }
  }, [companion.name]);

  const handleSend = async () => {
    if (message.trim() === '') return;

    const userMessage = {
      id: Date.now().toString(),
      text: message,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setMessage('');
    updateInteractions(1);

    // Simulate AI responding
    setIsTyping(true);
    setTimeout(async () => {
      const response = await generateAIResponse(message, companion);
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
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

  const renderMessageItem = ({ item }) => (
    <View style={[styles.messageBubble, item.isUser ? styles.userBubble : styles.companionBubble]}>
      {!item.isUser && (
        <Image 
          source={{ uri: companion.avatarUrl }} 
          style={styles.messageBubbleAvatar} 
        />
      )}
      <View style={[styles.messageContent, item.isUser ? styles.userContent : styles.companionContent]}>
        <Text style={[styles.messageText, item.isUser ? styles.userText : styles.companionText]}>
          {item.text}
        </Text>
        <Text style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={80}
    >
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Image 
            source={{ uri: companion.avatarUrl }} 
            style={styles.avatar} 
          />
          <View>
            <Text style={styles.name}>{companion.name}</Text>
            {isTyping ? (
              <Text style={styles.typingIndicator}>typing...</Text>
            ) : (
              <Text style={styles.status}>Online</Text>
            )}
          </View>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
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
          <TouchableOpacity style={styles.inputButton}>
            <PlusCircle size={24} color="#9C6ADE" />
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
            <TouchableOpacity style={styles.inputAttachment}>
              <Smile size={24} color="#9C6ADE" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.inputAttachment}>
              <ImageIcon size={24} color="#9C6ADE" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={[styles.sendButton, message.trim() ? styles.sendButtonActive : {}]}
            onPress={handleSend}
            disabled={!message.trim()}
          >
            <Send size={24} color={message.trim() ? "#FFFFFF" : "#BBBBBB"} />
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
    </KeyboardAvoidingView>
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
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#E1E1E1',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  status: {
    fontSize: 12,
    color: '#4CAF50',
  },
  typingIndicator: {
    fontSize: 12,
    color: '#9C6ADE',
    fontStyle: 'italic',
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 16,
    paddingTop: 8,
  },
  messageBubble: {
    marginBottom: 16,
    maxWidth: '80%',
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
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
    backgroundColor: '#E1E1E1',
  },
  messageContent: {
    padding: 12,
    borderRadius: 18,
  },
  userContent: {
    backgroundColor: '#FF6B8A',
    borderBottomRightRadius: 4,
  },
  companionContent: {
    backgroundColor: '#F0F0F0',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  userText: {
    color: '#FFFFFF',
  },
  companionText: {
    color: '#333333',
  },
  timestamp: {
    fontSize: 10,
    color: 'rgba(0, 0, 0, 0.5)',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 30 : 8,
    paddingHorizontal: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  inputButton: {
    padding: 8,
  },
  textInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F0F0F0',
    borderRadius: 24,
    paddingHorizontal: 12,
    marginHorizontal: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 20,
    maxHeight: 100,
    paddingTop: 10,
    paddingBottom: 10,
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
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#FF6B8A',
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
});