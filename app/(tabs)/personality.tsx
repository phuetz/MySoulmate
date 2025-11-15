import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Slider } from '@react-native-community/slider';
import { Brain, Heart, Zap, Users, Shield, Sparkles, MessageCircle, Music } from 'lucide-react-native';

/**
 * Écran de personnalisation du compagnon
 * Inspiré de Character.AI et Replika pour personnalité détaillée
 */

const PERSONALITY_TRAITS = [
  { id: 'openness', label: 'Ouverture', icon: Brain, color: '#9C6ADE', description: 'Curiosité et créativité' },
  { id: 'conscientiousness', label: 'Conscience', icon: Shield, color: '#4CAF50', description: 'Organisation et fiabilité' },
  { id: 'extraversion', label: 'Extraversion', icon: Users, color: '#FF9800', description: 'Sociabilité et énergie' },
  { id: 'agreeableness', label: 'Agréabilité', icon: Heart, color: '#FF6B8A', description: 'Bienveillance et coopération' },
  { id: 'neuroticism', label: 'Stabilité', icon: Zap, color: '#2196F3', description: 'Calme émotionnel' },
  { id: 'playfulness', label: 'Espièglerie', icon: Sparkles, color: '#FFD700', description: 'Humour et jeu' },
  { id: 'romanticism', label: 'Romantisme', icon: Heart, color: '#FF1493', description: 'Affection et tendresse' },
  { id: 'empathy', label: 'Empathie', icon: MessageCircle, color: '#00BCD4', description: 'Compréhension émotionnelle' },
];

const COMMUNICATION_STYLES = [
  { id: 'casual', label: 'Décontracté', emoji: '😊' },
  { id: 'formal', label: 'Formel', emoji: '🎩' },
  { id: 'playful', label: 'Joueur', emoji: '😜' },
  { id: 'romantic', label: 'Romantique', emoji: '🥰' },
  { id: 'poetic', label: 'Poétique', emoji: '📖' },
  { id: 'supportive', label: 'Soutenant', emoji: '🤗' },
  { id: 'intellectual', label: 'Intellectuel', emoji: '🧠' },
  { id: 'flirty', label: 'Charmeur', emoji: '😏' },
];

export default function PersonalityScreen() {
  const [traits, setTraits] = useState({
    openness: 0.7,
    conscientiousness: 0.6,
    extraversion: 0.5,
    agreeableness: 0.8,
    neuroticism: 0.3,
    playfulness: 0.6,
    romanticism: 0.5,
    empathy: 0.8,
  });

  const [communicationStyle, setCommunicationStyle] = useState('casual');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [nsfwEnabled, setNsfwEnabled] = useState(false);

  const updateTrait = (traitId: string, value: number) => {
    setTraits({ ...traits, [traitId]: value });
  };

  const savePersonality = () => {
    // TODO: Enregistrer via API
    console.log('Saving personality...', traits, communicationStyle);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.screenTitle}>Personnalité du Compagnon</Text>
      <Text style={styles.screenSubtitle}>
        Personnalisez la personnalité et le style de votre compagnon IA
      </Text>

      {/* Traits de personnalité */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Traits de Personnalité</Text>
        {PERSONALITY_TRAITS.map((trait) => {
          const Icon = trait.icon;
          return (
            <View key={trait.id} style={styles.traitContainer}>
              <View style={styles.traitHeader}>
                <View style={styles.traitLabelContainer}>
                  <View style={[styles.traitIcon, { backgroundColor: `${trait.color}20` }]}>
                    <Icon size={20} color={trait.color} />
                  </View>
                  <View>
                    <Text style={styles.traitLabel}>{trait.label}</Text>
                    <Text style={styles.traitDescription}>{trait.description}</Text>
                  </View>
                </View>
                <Text style={styles.traitValue}>{Math.round(traits[trait.id] * 100)}%</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={1}
                value={traits[trait.id]}
                onValueChange={(value) => updateTrait(trait.id, value)}
                minimumTrackTintColor={trait.color}
                maximumTrackTintColor="#E0E0E0"
                thumbTintColor={trait.color}
              />
            </View>
          );
        })}
      </View>

      {/* Style de communication */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Style de Communication</Text>
        <View style={styles.stylesGrid}>
          {COMMUNICATION_STYLES.map((style) => (
            <TouchableOpacity
              key={style.id}
              style={[
                styles.styleCard,
                communicationStyle === style.id && styles.styleCardSelected,
              ]}
              onPress={() => setCommunicationStyle(style.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.styleEmoji}>{style.emoji}</Text>
              <Text
                style={[
                  styles.styleLabel,
                  communicationStyle === style.id && styles.styleLabelSelected,
                ]}
              >
                {style.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Options avancées */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Options Avancées</Text>

        <View style={styles.optionRow}>
          <View style={styles.optionInfo}>
            <Text style={styles.optionLabel}>Réponses vocales</Text>
            <Text style={styles.optionDescription}>Activer les interactions vocales</Text>
          </View>
          <Switch
            value={voiceEnabled}
            onValueChange={setVoiceEnabled}
            trackColor={{ false: '#E0E0E0', true: '#9C6ADE' }}
            thumbColor={voiceEnabled ? '#FFFFFF' : '#F4F4F4'}
          />
        </View>

        <View style={styles.optionRow}>
          <View style={styles.optionInfo}>
            <Text style={styles.optionLabel}>Mode NSFW</Text>
            <Text style={styles.optionDescription}>Conversations intimes (Premium)</Text>
          </View>
          <Switch
            value={nsfwEnabled}
            onValueChange={setNsfwEnabled}
            trackColor={{ false: '#E0E0E0', true: '#FF6B8A' }}
            thumbColor={nsfwEnabled ? '#FFFFFF' : '#F4F4F4'}
          />
        </View>
      </View>

      {/* Bouton Save */}
      <TouchableOpacity style={styles.saveButton} onPress={savePersonality}>
        <Text style={styles.saveButtonText}>Enregistrer les Modifications</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  content: {
    padding: 16,
    paddingTop: 60,
    paddingBottom: 40,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 8,
  },
  screenSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 24,
    lineHeight: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  traitContainer: {
    marginBottom: 20,
  },
  traitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  traitLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  traitIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  traitLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  traitDescription: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
  },
  traitValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9C6ADE',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  stylesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  styleCard: {
    width: '23%',
    aspectRatio: 1,
    margin: '1%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  styleCardSelected: {
    backgroundColor: '#F0E6FF',
    borderColor: '#9C6ADE',
  },
  styleEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  styleLabel: {
    fontSize: 11,
    color: '#666666',
    textAlign: 'center',
    fontWeight: '500',
  },
  styleLabelSelected: {
    color: '#9C6ADE',
    fontWeight: '600',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionInfo: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 12,
    color: '#999999',
  },
  saveButton: {
    backgroundColor: '#9C6ADE',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#9C6ADE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
