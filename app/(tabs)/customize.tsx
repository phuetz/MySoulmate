import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, Switch } from 'react-native';
import { Heart, User, Book, Brain, Gift, Star } from 'lucide-react-native';
import { useAppState } from '@/context/AppStateContext';
import PremiumFeatureModal from '@/components/PremiumFeatureModal';
import { personalityTraits, avatarOptions } from '@/data/companionData';

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
      newTraits.push(trait);
    }
    
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Customize Your Companion</Text>
      </View>
      
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
              <View style={styles.optionsRow}>
                <TouchableOpacity 
                  style={[styles.optionButton, styles.selectedOptionButton]}
                >
                  <Text style={styles.optionButtonText}>Realistic</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.optionButton}
                  onPress={() => !isPremium && setShowPremiumModal(true)}
                >
                  <Text style={styles.optionButtonText}>Anime</Text>
                  {!isPremium && (
                    <View style={styles.optionPremiumBadge}>
                      <Star size={10} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.optionButton}
                  onPress={() => !isPremium && setShowPremiumModal(true)}
                >
                  <Text style={styles.optionButtonText}>Fantasy</Text>
                  {!isPremium && (
                    <View style={styles.optionPremiumBadge}>
                      <Star size={10} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
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
                const isSelected = selectedTraits.some(t => t.id === trait.id);
                return (
                  <TouchableOpacity
                    key={trait.id}
                    style={[
                      styles.traitItem,
                      isSelected && styles.selectedTraitItem
                    ]}
                    onPress={() => handleTraitToggle(trait)}
                  >
                    <Text style={[
                      styles.traitName,
                      isSelected && styles.selectedTraitName
                    ]}>
                      {trait.name}
                    </Text>
                    {trait.premium && !isPremium && (
                      <View style={styles.traitPremiumBadge}>
                        <Star size={10} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>
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
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 12,
  },
  optionsRow: {
    flexDirection: 'row',
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
  personalityContainer: {
    marginBottom: 24,
  },
  traitsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  traitItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
    marginBottom: 8,
  },
  selectedTraitItem: {
    backgroundColor: '#FF6B8A',
  },
  traitName: {
    color: '#333333',
    fontWeight: '500',
  },
  selectedTraitName: {
    color: '#FFFFFF',
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