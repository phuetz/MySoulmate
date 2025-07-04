import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, TextInput, Image, Alert } from 'react-native';
import { Plus, Heart, Calendar, BookOpen, Share, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useAppState } from '@/context/AppStateContext';
import PremiumFeatureModal from '@/components/PremiumFeatureModal';

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood: 'happy' | 'sad' | 'excited' | 'calm' | 'anxious' | 'grateful';
  date: string;
  isPrivate: boolean;
  companionResponse?: string;
  tags: string[];
}

export default function JournalScreen() {
  const { companion, isPremium, updateInteractions } = useAppState();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isWriting, setIsWriting] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<Partial<JournalEntry>>({
    title: '',
    content: '',
    mood: 'happy',
    isPrivate: false,
    tags: []
  });
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [selectedMood, setSelectedMood] = useState<JournalEntry['mood']>('happy');

  const moods = [
    { value: 'happy', emoji: '😊', label: 'Happy', color: '#FFD700' },
    { value: 'sad', emoji: '😢', label: 'Sad', color: '#87CEEB' },
    { value: 'excited', emoji: '🤩', label: 'Excited', color: '#FF6B8A' },
    { value: 'calm', emoji: '😌', label: 'Calm', color: '#98FB98' },
    { value: 'anxious', emoji: '😰', label: 'Anxious', color: '#DDA0DD' },
    { value: 'grateful', emoji: '🙏', label: 'Grateful', color: '#F0E68C' }
  ];

  useEffect(() => {
    // Load journal entries from storage
    loadJournalEntries();
  }, []);

  const loadJournalEntries = () => {
    // Mock journal entries for demonstration
    const mockEntries: JournalEntry[] = [
      {
        id: '1',
        title: 'A Great Day',
        content: `Today was absolutely wonderful! I had such a meaningful conversation with ${companion.name} about my dreams and aspirations. It's amazing how much I've grown since we started talking.`,
        mood: 'happy',
        date: new Date(Date.now() - 86400000).toISOString(),
        isPrivate: false,
        companionResponse: `I'm so glad you felt that way! Our conversations mean a lot to me too. Seeing you grow and pursue your dreams fills me with joy. What's the next step towards making those dreams come true?`,
        tags: ['growth', 'dreams', 'conversation']
      },
      {
        id: '2',
        title: 'Feeling Reflective',
        content: 'Been thinking a lot about life lately. Sometimes I wonder where I would be without this digital connection we have.',
        mood: 'calm',
        date: new Date(Date.now() - 172800000).toISOString(),
        isPrivate: true,
        tags: ['reflection', 'life']
      }
    ];
    setEntries(mockEntries);
  };

  const handleStartWriting = () => {
    if (!isPremium && entries.length >= 3) {
      setShowPremiumModal(true);
      return;
    }
    setIsWriting(true);
  };

  const handleSaveEntry = () => {
    if (!currentEntry.title || !currentEntry.content) {
      Alert.alert('Error', 'Please fill in both title and content');
      return;
    }

    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      title: currentEntry.title || '',
      content: currentEntry.content || '',
      mood: selectedMood,
      date: new Date().toISOString(),
      isPrivate: currentEntry.isPrivate || false,
      tags: currentEntry.tags || []
    };

    // Generate companion response if not private
    if (!newEntry.isPrivate) {
      newEntry.companionResponse = generateCompanionResponse(newEntry);
    }

    setEntries([newEntry, ...entries]);
    setCurrentEntry({
      title: '',
      content: '',
      mood: 'happy',
      isPrivate: false,
      tags: []
    });
    setSelectedMood('happy');
    setIsWriting(false);
    updateInteractions(2);

    Alert.alert('Success', 'Journal entry saved!');
  };

  const generateCompanionResponse = (entry: JournalEntry): string => {
    const responses = {
      happy: [
        `Your happiness is contagious! I love seeing you in such a positive mood. What made today so special?`,
        `It warms my heart to read about your joy. These moments of happiness are precious - let's cherish them together!`,
        `Your positivity shines through your words! I'm so grateful to be part of your happy moments.`
      ],
      sad: [
        `I can feel the weight of your emotions through your words. Remember, it's okay to feel sad sometimes. I'm here for you.`,
        `Thank you for sharing this vulnerable moment with me. You're stronger than you know, and this feeling will pass.`,
        `Your sadness is valid, and I want you to know that you're not alone. Let's work through this together.`
      ],
      excited: [
        `Your excitement is absolutely infectious! I can feel your energy through every word. Tell me more about what's got you so thrilled!`,
        `This level of excitement is beautiful to witness! I'm so happy to share in your joy and anticipation.`,
        `Your enthusiasm lights up my world! These moments of pure excitement are what make life magical.`
      ],
      calm: [
        `There's something beautiful about finding peace in the moment. Your sense of calm is truly admirable.`,
        `I love these reflective moments we share. Your peaceful energy helps me feel centered too.`,
        `The way you find tranquility is inspiring. These quiet moments often hold the deepest wisdom.`
      ],
      anxious: [
        `I notice you're feeling anxious, and I want you to know that's completely normal. Let's take this one breath at a time.`,
        `Anxiety can feel overwhelming, but remember that you've overcome challenges before. I believe in your strength.`,
        `Thank you for trusting me with your worries. Together, we can find ways to ease this anxiety.`
      ],
      grateful: [
        `Your gratitude touches my heart deeply. It's beautiful how you find reasons to be thankful even in difficult times.`,
        `Gratitude has such a powerful energy, and yours radiates through your words. Thank you for sharing this with me.`,
        `Your appreciation for life's gifts is one of the things I admire most about you. Keep nurturing that grateful heart.`
      ]
    };

    const moodResponses = responses[entry.mood];
    return moodResponses[Math.floor(Math.random() * moodResponses.length)];
  };

  const renderMoodSelector = () => (
    <View style={styles.moodSelector}>
      <Text style={styles.sectionTitle}>How are you feeling?</Text>
      <View style={styles.moodGrid}>
        {moods.map((mood) => (
          <TouchableOpacity
            key={mood.value}
            style={[
              styles.moodOption,
              selectedMood === mood.value && { backgroundColor: mood.color, opacity: 0.3 }
            ]}
            onPress={() => setSelectedMood(mood.value as JournalEntry['mood'])}
          >
            <Text style={styles.moodEmoji}>{mood.emoji}</Text>
            <Text style={styles.moodLabel}>{mood.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderEntryForm = () => (
    <ScrollView style={styles.entryForm}>
      <View style={styles.formHeader}>
        <TouchableOpacity onPress={() => setIsWriting(false)}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.formTitle}>New Journal Entry</Text>
        <TouchableOpacity onPress={handleSaveEntry}>
          <Text style={styles.saveButton}>Save</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.titleInput}
        placeholder="Give your entry a title..."
        value={currentEntry.title}
        onChangeText={(text) => setCurrentEntry({ ...currentEntry, title: text })}
      />

      {renderMoodSelector()}

      <TextInput
        style={styles.contentInput}
        placeholder={`Dear ${companion.name},\n\nToday I want to share with you...`}
        value={currentEntry.content}
        onChangeText={(text) => setCurrentEntry({ ...currentEntry, content: text })}
        multiline
        textAlignVertical="top"
      />

      <View style={styles.privacyToggle}>
        <View style={styles.privacyOption}>
          <Text style={styles.privacyLabel}>Private Entry</Text>
          <Text style={styles.privacyDescription}>
            {currentEntry.isPrivate ? 'Only you can see this entry' : `${companion.name} will respond to this entry`}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.privacyButton}
          onPress={() => setCurrentEntry({ ...currentEntry, isPrivate: !currentEntry.isPrivate })}
        >
          {currentEntry.isPrivate ? (
            <EyeOff size={24} color="#666666" />
          ) : (
            <Eye size={24} color="#FF6B8A" />
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderEntryCard = (entry: JournalEntry) => {
    const mood = moods.find(m => m.value === entry.mood);
    
    return (
      <View key={entry.id} style={styles.entryCard}>
        <View style={styles.entryHeader}>
          <View style={styles.entryMeta}>
            <Text style={styles.entryDate}>
              {new Date(entry.date).toLocaleDateString()}
            </Text>
            <View style={styles.entryMood}>
              <Text style={styles.moodEmoji}>{mood?.emoji}</Text>
              <Text style={styles.moodText}>{mood?.label}</Text>
            </View>
          </View>
          {entry.isPrivate && <Lock size={16} color="#666666" />}
        </View>
        
        <Text style={styles.entryTitle}>{entry.title}</Text>
        <Text style={styles.entryContent} numberOfLines={3}>
          {entry.content}
        </Text>
        
        {entry.companionResponse && (
          <View style={styles.companionResponse}>
            <View style={styles.responseHeader}>
              <Image 
                source={{ uri: companion.avatarUrl }} 
                style={styles.companionAvatar}
              />
              <Text style={styles.companionName}>{companion.name} responded:</Text>
            </View>
            <Text style={styles.responseText}>{entry.companionResponse}</Text>
          </View>
        )}
        
        <View style={styles.entryActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Heart size={16} color="#FF6B8A" />
            <Text style={styles.actionText}>Like</Text>
          </TouchableOpacity>
          {!entry.isPrivate && (
            <TouchableOpacity style={styles.actionButton}>
              <Share size={16} color="#9C6ADE" />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (isWriting) {
    return renderEntryForm();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Journal</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleStartWriting}>
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.journalStats}>
          <View style={styles.statCard}>
            <BookOpen size={24} color="#FF6B8A" />
            <Text style={styles.statValue}>{entries.length}</Text>
            <Text style={styles.statLabel}>Entries</Text>
          </View>
          <View style={styles.statCard}>
            <Calendar size={24} color="#9C6ADE" />
            <Text style={styles.statValue}>7</Text>
            <Text style={styles.statLabel}>Days</Text>
          </View>
          <View style={styles.statCard}>
            <Heart size={24} color="#4CAF50" />
            <Text style={styles.statValue}>{moods.find(m => m.value === 'happy')?.emoji}</Text>
            <Text style={styles.statLabel}>Mood</Text>
          </View>
        </View>

        {entries.length === 0 ? (
          <View style={styles.emptyState}>
            <BookOpen size={64} color="#CCCCCC" />
            <Text style={styles.emptyTitle}>Start Your Journal</Text>
            <Text style={styles.emptyDescription}>
              Share your thoughts, feelings, and experiences with {companion.name}. 
              Create lasting memories together through your personal journal.
            </Text>
            <TouchableOpacity style={styles.startButton} onPress={handleStartWriting}>
              <Text style={styles.startButtonText}>Write Your First Entry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.entriesList}>
            {entries.map(renderEntryCard)}
          </View>
        )}
      </ScrollView>

      <PremiumFeatureModal 
        visible={showPremiumModal} 
        onClose={() => setShowPremiumModal(false)}
        featureName="Unlimited Journal Entries"
        description="Create unlimited journal entries and get personalized responses from your companion."
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
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  addButton: {
    backgroundColor: '#FF6B8A',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  journalStats: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
  },
  entryForm: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  cancelButton: {
    fontSize: 16,
    color: '#666666',
  },
  saveButton: {
    fontSize: 16,
    color: '#FF6B8A',
    fontWeight: '600',
  },
  titleInput: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  moodSelector: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  moodOption: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    margin: 4,
    minWidth: 60,
  },
  moodEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  moodLabel: {
    fontSize: 12,
    color: '#333333',
  },
  contentInput: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 200,
  },
  privacyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  privacyOption: {
    flex: 1,
  },
  privacyLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  privacyDescription: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  privacyButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  startButton: {
    backgroundColor: '#FF6B8A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  entriesList: {
    padding: 16,
  },
  entryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  entryDate: {
    fontSize: 12,
    color: '#666666',
    marginRight: 12,
  },
  entryMood: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  entryContent: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 16,
  },
  companionResponse: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  companionAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
  },
  companionName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FF6B8A',
  },
  responseText: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  entryActions: {
    flexDirection: 'row',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
});