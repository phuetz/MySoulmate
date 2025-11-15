import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, User, Book, Brain, Gift, Star, Plus, Minus, Smile, Mic } from 'lucide-react-native';
import { useAppState } from '@/context/AppStateContext';
import PremiumFeatureModal from '@/components/PremiumFeatureModal';
import { personalityTraits, avatarOptions, avatarStyles, emotionalStates } from '@/data/companionData';

export default function CustomizeScreen() {
  const { companion, updateCompanion, isPremium } = useAppState();
  const [selectedTab, setSelectedTab] = useState('appearance');
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [selectedTraits, setSelectedTraits] = useState(companion?.personalityTraits || []);

  const handleAvatarSelect = (avatar) => {
    if (!isPremium && avatar.premium) {
      setShowPremiumModal(true);
    } else {
      updateCompanion({
        ...companion,
        avatarUrl: avatar.url,
        avatarName: avatar.name
      });
    }
  };

  const handleTraitToggle = (trait) => {
    if (!isPremium && trait.premium) {
      setShowPremiumModal(true);
      return;
    }
    
    const newTraits = [...selectedTraits];
    const existingIndex = newTraits.findIndex(t => t.id === trait.id);
    
    if (existingIndex >= 0) {
      newTraits.splice(existingIndex, 1);
    } else {
      // Limit to 5 traits max
      if (newTraits.length >= 5) {
        newTraits.pop();
      }
      newTraits.push({ ...trait, intensity: 3 });
    }
    
    setSelectedTraits(newTraits);
    updateCompanion({
      ...companion,
      personalityTraits: newTraits
    });
  };

  const adjustTraitIntensity = (traitId, delta) => {
    const newTraits = selectedTraits.map(t => {
      if (t.id === traitId) {
        let intensity = (t.intensity || 3) + delta;
        if (intensity < 1) intensity = 1;
        if (intensity > 5) intensity = 5;
        return { ...t, intensity };
      }
      return t;
    });
    setSelectedTraits(newTraits);
    updateCompanion({
      ...companion,
      personalityTraits: newTraits
    });
  };

  const handleNameChange = (name) => {
    updateCompanion({
      ...companion,
      name
    });
  };

  const handleAvatarStyleSelect = (styleId) => {
    const style = avatarStyles.find(s => s.id === styleId);
    if (!isPremium && style?.premium) {
      setShowPremiumModal(true);
    } else {
      updateCompanion({
        ...companion,
        avatarStyle: styleId
      });
    }
  };

  const handleMoodSelect = (moodId) => {
    updateCompanion({
      ...companion,
      currentMood: moodId
    });
  };

  const handleVoiceToneSelect = (tone) => {
    updateCompanion({
      ...companion,
      voiceTone: tone
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FF6B8A', '#9C6ADE']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Customize Your Companion</Text>
      </LinearGradient>
      
      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'appearance' && styles.selectedTab]} 
          onPress={() => setSelectedTab('appearance')}
        >
          <User size={20} color={selectedTab === 'appearance' ? '#FF6B8A' : '#666666'} />
          <Text style={[styles.tabText, selectedTab === 'appearance' && styles.selectedTabText]}>
            Appearance
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'personality' && styles.selectedTab]} 
          onPress={() => setSelectedTab('personality')}
        >
          <Brain size={20} color={selectedTab === 'personality' ? '#FF6B8A' : '#666666'} />
          <Text style={[styles.tabText, selectedTab === 'personality' && styles.selectedTabText]}>
            Personality
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'relationship' && styles.selectedTab]} 
          onPress={() => setSelectedTab('relationship')}
        >
          <Heart size={20} color={selectedTab === 'relationship' ? '#FF6B8A' : '#666666'} />
          <Text style={[styles.tabText, selectedTab === 'relationship' && styles.selectedTabText]}>
            Relationship
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content}>
        {selectedTab === 'appearance' && (
          <View style={styles.appearanceContainer}>
            <Text style={styles.sectionTitle}>Choose Avatar</Text>
            
            <View style={styles.avatarGrid}>
              {avatarOptions.map((avatar) => (
                <TouchableOpacity
                  key={avatar.id}
                  style={[
                    styles.avatarItem,
                    companion.avatarUrl === avatar.url && styles.selectedAvatarItem
                  ]}
                  onPress={() => handleAvatarSelect(avatar)}
                >
                  <Image 
                    source={{ uri: avatar.url }} 
                    style={styles.avatarImage}
                  />
                  {avatar.premium && !isPremium && (
                    <View style={styles.premiumBadge}>
                      <Star size={12} color="#FFFFFF" />
                    </View>
                  )}
                  {companion.avatarUrl === avatar.url && (
                    <View style={styles.selectedAvatarBadge} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.customizationOptions}>
              <Text style={styles.optionTitle}>Avatar Style</Text>
              <View style={styles.stylesGrid}>
                {avatarStyles.map((style) => {
                  const isSelected = companion.avatarStyle === style.id;
                  const isPremiumStyle = style.premium && !isPremium;
                  return (
                    <TouchableOpacity
                      key={style.id}
                      style={[
                        styles.styleCard,
                        isSelected && styles.selectedStyleCard
                      ]}
                      onPress={() => handleAvatarStyleSelect(style.id)}
                    >
                      <LinearGradient
                        colors={isSelected ? ['#FF6B8A', '#FF8FA3'] : ['#F8F9FA', '#F8F9FA']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.styleCardGradient}
                      >
                        <Text style={styles.styleIcon}>{style.icon}</Text>
                        <Text style={[
                          styles.styleName,
                          isSelected && styles.selectedStyleName
                        ]}>
                          {style.name}
                        </Text>
                        <Text style={[
                          styles.styleDescription,
                          isSelected && styles.selectedStyleDescription
                        ]}>
                          {style.description}
                        </Text>
                        {isPremiumStyle && (
                          <View style={styles.stylePremiumBadge}>
                            <Star size={12} color="#FFFFFF" fill="#FFFFFF" />
                          </View>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.customizationOptions}>
              <Text style={styles.optionTitle}>
                <Smile size={18} color="#333333" /> Current Mood
              </Text>
              <Text style={styles.optionSubtitle}>
                Choose how your companion feels right now
              </Text>
              <View style={styles.moodsGrid}>
                {emotionalStates.map((mood) => {
                  const isSelected = companion.currentMood === mood.id;
                  return (
                    <TouchableOpacity
                      key={mood.id}
                      style={[
                        styles.moodCard,
                        isSelected && styles.selectedMoodCard,
                        { borderColor: isSelected ? mood.color : '#E8E8E8' }
                      ]}
                      onPress={() => handleMoodSelect(mood.id)}
                    >
                      <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                      <Text style={[
                        styles.moodName,
                        isSelected && { color: mood.color }
                      ]}>
                        {mood.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.customizationOptions}>
              <Text style={styles.optionTitle}>
                <Mic size={18} color="#333333" /> Voice Tone
              </Text>
              <Text style={styles.optionSubtitle}>
                Customize how your companion sounds
              </Text>
              <View style={styles.optionsRow}>
                {['soft', 'energetic', 'sultry', 'professional'].map((tone) => {
                  const isSelected = companion.voiceTone === tone;
                  return (
                    <TouchableOpacity
                      key={tone}
                      style={[
                        styles.voiceToneButton,
                        isSelected && styles.selectedVoiceToneButton
                      ]}
                      onPress={() => handleVoiceToneSelect(tone)}
                    >
                      <Text style={[
                        styles.voiceToneText,
                        isSelected && styles.selectedVoiceToneText
                      ]}>
                        {tone.charAt(0).toUpperCase() + tone.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        )}
        
        {selectedTab === 'personality' && (
          <View style={styles.personalityContainer}>
            <Text style={styles.sectionTitle}>Personality Traits</Text>
            <Text style={styles.sectionDescription}>
              Select up to 5 traits to shape your companion's personality.
            </Text>
            
            <View style={styles.traitsContainer}>
              {personalityTraits.map((trait) => {
                const selected = selectedTraits.find(t => t.id === trait.id);
                const isSelected = !!selected;
                return (
                  <View key={trait.id} style={styles.traitWrapper}>
                    <TouchableOpacity
                      style={[
                        styles.traitItem,
                        isSelected && styles.selectedTraitItem
                      ]}
                      onPress={() => handleTraitToggle(trait)}
                    >
                      <View style={styles.traitContent}>
                        <Text style={styles.traitIcon}>{trait.icon}</Text>
                        <Text
                          style={[
                            styles.traitName,
                            isSelected && styles.selectedTraitName
                          ]}
                        >
                          {trait.name}
                        </Text>
                      </View>
                      {trait.premium && !isPremium && (
                        <View style={styles.traitPremiumBadge}>
                          <Star size={10} color="#FFFFFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                    {isSelected && (
                      <View style={styles.intensityControls}>
                        <TouchableOpacity onPress={() => adjustTraitIntensity(trait.id, -1)}>
                          <Minus size={12} color="#333" />
                        </TouchableOpacity>
                        <Text style={styles.intensityValue}>{selected.intensity}</Text>
                        <TouchableOpacity onPress={() => adjustTraitIntensity(trait.id, 1)}>
                          <Plus size={12} color="#333" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
            
            <View style={styles.interestsContainer}>
              <Text style={styles.sectionTitle}>Interests & Hobbies</Text>
              <Text style={styles.sectionDescription}>
                Add interests to make conversations more engaging.
              </Text>
              
              <View style={styles.interestInputContainer}>
                <TouchableOpacity 
                  style={styles.addInterestButton}
                  onPress={() => !isPremium && setShowPremiumModal(true)}
                >
                  <Text style={styles.addInterestText}>+ Add Custom Interest</Text>
                  {!isPremium && (
                    <View style={styles.interestPremiumBadge}>
                      <Star size={10} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        
        {selectedTab === 'relationship' && (
          <View style={styles.relationshipContainer}>
            <Text style={styles.sectionTitle}>Relationship Type</Text>
            
            <View style={styles.relationshipOptions}>
              <TouchableOpacity style={[styles.relationshipOption, styles.selectedRelationshipOption]}>
                <Text style={styles.relationshipOptionText}>Friend</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.relationshipOption}
                onPress={() => !isPremium && setShowPremiumModal(true)}
              >
                <Text style={styles.relationshipOptionText}>Romantic Partner</Text>
                {!isPremium && (
                  <View style={styles.relationshipPremiumBadge}>
                    <Star size={10} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.relationshipOption}
                onPress={() => !isPremium && setShowPremiumModal(true)}
              >
                <Text style={styles.relationshipOptionText}>Mentor</Text>
                {!isPremium && (
                  <View style={styles.relationshipPremiumBadge}>
                    <Star size={10} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
            
            <View style={styles.nsfwContainer}>
              <View style={styles.nsfwSetting}>
                <View>
                  <Text style={styles.nsfwTitle}>NSFW Content</Text>
                  <Text style={styles.nsfwDescription}>
                    Enable more intimate conversations
                  </Text>
                </View>
                <Switch
                  value={companion?.nsfwEnabled || false}
                  onValueChange={(value) => {
                    if (!isPremium && value) {
                      setShowPremiumModal(true);
                    } else {
                      updateCompanion({
                        ...companion,
                        nsfwEnabled: value
                      });
                    }
                  }}
                  trackColor={{ false: '#E1E1E1', true: '#FF6B8A' }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor="#E1E1E1"
                />
              </View>
              {!isPremium && (
                <View style={styles.premiumFeatureBadge}>
                  <Star size={12} color="#FFFFFF" />
                  <Text style={styles.premiumFeatureText}>Premium</Text>
                </View>
              )}
            </View>
            
            <View style={styles.memoriesContainer}>
              <Text style={styles.sectionTitle}>Relationship Memories</Text>
              <Text style={styles.sectionDescription}>
                Add key memories to enhance your relationship history.
              </Text>
              
              <TouchableOpacity 
                style={styles.addMemoryButton}
                onPress={() => !isPremium && setShowPremiumModal(true)}
              >
                <Book size={20} color="#9C6ADE" />
                <Text style={styles.addMemoryText}>Add New Memory</Text>
                {!isPremium && (
                  <View style={styles.memoryPremiumBadge}>
                    <Star size={10} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
      
      <PremiumFeatureModal 
        visible={showPremiumModal} 
        onClose={() => setShowPremiumModal(false)}
        featureName="Advanced Customization"
        description="Unlock premium avatars, personality traits, and relationship settings."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  selectedTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#FF6B8A',
  },
  tabText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 6,
  },
  selectedTabText: {
    color: '#FF6B8A',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 20,
  },
  appearanceContainer: {
    marginBottom: 24,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  avatarItem: {
    width: '23%',
    aspectRatio: 1,
    margin: '1%',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedAvatarItem: {
    borderColor: '#FF6B8A',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E1E1E1',
  },
  premiumBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#9C6ADE',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedAvatarBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: '#FF6B8A',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customizationOptions: {
    marginBottom: 24,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
    lineHeight: 20,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
  },
  selectedOptionButton: {
    backgroundColor: '#FF6B8A',
  },
  optionButtonText: {
    color: '#333333',
    fontWeight: '500',
  },
  optionPremiumBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#9C6ADE',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stylesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  styleCard: {
    width: '48%',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  selectedStyleCard: {
    shadowColor: '#FF6B8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  styleCardGradient: {
    padding: 16,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  styleIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  styleName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 4,
    textAlign: 'center',
  },
  selectedStyleName: {
    color: '#FFFFFF',
  },
  styleDescription: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 16,
  },
  selectedStyleDescription: {
    color: '#FFFFFF',
    opacity: 0.9,
  },
  stylePremiumBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#9C6ADE',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  moodCard: {
    width: '23%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E8E8E8',
    marginBottom: 8,
  },
  selectedMoodCard: {
    backgroundColor: '#FFF5F8',
    borderWidth: 2,
  },
  moodEmoji: {
    fontSize: 28,
    marginBottom: 6,
  },
  moodName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
  },
  voiceToneButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: '#E8E8E8',
    marginBottom: 8,
  },
  selectedVoiceToneButton: {
    backgroundColor: '#FFF0F3',
    borderColor: '#FF6B8A',
  },
  voiceToneText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  selectedVoiceToneText: {
    color: '#FF6B8A',
  },
  personalityContainer: {
    marginBottom: 24,
  },
  traitsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  traitItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    borderWidth: 2,
    borderColor: '#E8E8E8',
    shadowColor: '#9C6ADE',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedTraitItem: {
    backgroundColor: '#FF6B8A',
    borderColor: '#FF6B8A',
  },
  traitWrapper: {
    marginRight: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  traitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  traitIcon: {
    fontSize: 16,
  },
  traitName: {
    color: '#333333',
    fontWeight: '600',
    fontSize: 14,
  },
  selectedTraitName: {
    color: '#FFFFFF',
  },
  intensityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  intensityValue: {
    marginHorizontal: 4,
    fontSize: 12,
    color: '#333333',
  },
  traitPremiumBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#9C6ADE',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  interestsContainer: {
    marginBottom: 24,
  },
  interestInputContainer: {
    marginTop: 16,
  },
  addInterestButton: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  addInterestText: {
    color: '#9C6ADE',
    fontWeight: '500',
  },
  interestPremiumBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#9C6ADE',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  relationshipContainer: {
    marginBottom: 24,
  },
  relationshipOptions: {
    marginBottom: 24,
  },
  relationshipOption: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  selectedRelationshipOption: {
    backgroundColor: '#FF6B8A',
  },
  relationshipOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  relationshipPremiumBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#9C6ADE',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nsfwContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  nsfwSetting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nsfwTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  nsfwDescription: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  premiumFeatureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9C6ADE',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  premiumFeatureText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  memoriesContainer: {
    marginBottom: 24,
  },
  addMemoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  addMemoryText: {
    color: '#9C6ADE',
    fontWeight: '500',
    marginLeft: 8,
  },
  memoryPremiumBadge: {
    backgroundColor: '#9C6ADE',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});