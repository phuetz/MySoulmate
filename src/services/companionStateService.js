const { CompanionState } = require('../models');
const { logger } = require('../config/logger');

/**
 * Service de gestion de l'état émotionnel et relationnel du compagnon
 * Inspiré de Replika et Zeta pour des interactions dynamiques et personnalisées
 */

// Mapping des points de relation vers les niveaux
const RELATIONSHIP_THRESHOLDS = {
  stranger: { min: 0, max: 20 },
  acquaintance: { min: 20, max: 40 },
  friend: { min: 40, max: 60 },
  close_friend: { min: 60, max: 75 },
  best_friend: { min: 75, max: 85 },
  romantic: { min: 85, max: 95 },
  soulmate: { min: 95, max: 100 },
};

/**
 * Initialise l'état d'un nouveau compagnon
 */
exports.initializeCompanionState = async (userId, companionId, personalityTraits = {}) => {
  try {
    const defaultTraits = {
      openness: 0.7,
      conscientiousness: 0.6,
      extraversion: 0.5,
      agreeableness: 0.8,
      neuroticism: 0.3,
      playfulness: 0.6,
      romanticism: 0.5,
      empathy: 0.8,
      ...personalityTraits,
    };

    const state = await CompanionState.create({
      userId,
      companionId,
      personalityTraits: defaultTraits,
      currentEmotion: 'curious',
      emotionIntensity: 0.6,
      mood: 'good',
      moodScore: 0.6,
      energy: 80,
      relationshipLevel: 'stranger',
      relationshipPoints: 5,
      intimacyLevel: 0,
      trust: 50,
      affection: 30,
    });

    logger.info('Companion state initialized:', { userId, companionId });

    return state;
  } catch (error) {
    logger.error('Failed to initialize companion state:', error);
    throw error;
  }
};

/**
 * Récupère l'état actuel du compagnon
 */
exports.getCompanionState = async (companionId) => {
  try {
    const state = await CompanionState.findOne({
      where: { companionId },
    });

    if (!state) {
      throw new Error('Companion state not found');
    }

    return state;
  } catch (error) {
    logger.error('Failed to get companion state:', error);
    throw error;
  }
};

/**
 * Met à jour l'émotion du compagnon
 */
exports.updateEmotion = async (companionId, emotion, intensity = null) => {
  try {
    const state = await exports.getCompanionState(companionId);

    const updates = {
      currentEmotion: emotion,
      lastEmotionChange: new Date(),
    };

    if (intensity !== null) {
      updates.emotionIntensity = Math.max(0, Math.min(1, intensity));
    }

    await state.update(updates);

    logger.info('Companion emotion updated:', { companionId, emotion, intensity });

    return state;
  } catch (error) {
    logger.error('Failed to update emotion:', error);
    throw error;
  }
};

/**
 * Met à jour l'humeur du compagnon basée sur les interactions
 */
exports.updateMood = async (companionId, adjustment) => {
  try {
    const state = await exports.getCompanionState(companionId);

    // Ajuster le score d'humeur (-0.2 à +0.2 typiquement)
    let newMoodScore = state.moodScore + adjustment;
    newMoodScore = Math.max(0, Math.min(1, newMoodScore));

    // Déterminer l'humeur basée sur le score
    let mood = 'neutral';
    if (newMoodScore > 0.7) mood = 'great';
    else if (newMoodScore > 0.4) mood = 'good';
    else if (newMoodScore > 0.2) mood = 'neutral';
    else mood = 'low';

    await state.update({
      moodScore: newMoodScore,
      mood,
      lastMoodUpdate: new Date(),
    });

    logger.info('Companion mood updated:', { companionId, mood, score: newMoodScore });

    return state;
  } catch (error) {
    logger.error('Failed to update mood:', error);
    throw error;
  }
};

/**
 * Ajoute des points de relation
 */
exports.addRelationshipPoints = async (companionId, points) => {
  try {
    const state = await exports.getCompanionState(companionId);

    let newPoints = state.relationshipPoints + points;
    newPoints = Math.max(0, Math.min(100, newPoints));

    // Déterminer le nouveau niveau
    let newLevel = state.relationshipLevel;
    for (const [level, threshold] of Object.entries(RELATIONSHIP_THRESHOLDS)) {
      if (newPoints >= threshold.min && newPoints < threshold.max) {
        newLevel = level;
        break;
      }
    }

    const updates = { relationshipPoints: newPoints };

    // Si niveau a changé, ajouter un milestone
    if (newLevel !== state.relationshipLevel) {
      updates.relationshipLevel = newLevel;

      const milestones = state.milestones || {};
      milestones[`reached_${newLevel}`] = new Date();
      updates.milestones = milestones;

      logger.info('Relationship level up!', {
        companionId,
        oldLevel: state.relationshipLevel,
        newLevel,
        points: newPoints,
      });
    }

    await state.update(updates);

    return state;
  } catch (error) {
    logger.error('Failed to add relationship points:', error);
    throw error;
  }
};

/**
 * Met à jour l'intimité, la confiance et l'affection
 */
exports.updateRelationshipMetrics = async (companionId, { intimacy, trust, affection }) => {
  try {
    const state = await exports.getCompanionState(companionId);

    const updates = {};

    if (intimacy !== undefined) {
      updates.intimacyLevel = Math.max(0, Math.min(100, state.intimacyLevel + intimacy));
    }

    if (trust !== undefined) {
      updates.trust = Math.max(0, Math.min(100, state.trust + trust));
    }

    if (affection !== undefined) {
      updates.affection = Math.max(0, Math.min(100, state.affection + affection));
    }

    await state.update(updates);

    logger.info('Relationship metrics updated:', { companionId, updates });

    return state;
  } catch (error) {
    logger.error('Failed to update relationship metrics:', error);
    throw error;
  }
};

/**
 * Enregistre une interaction
 */
exports.recordInteraction = async (companionId, durationMinutes = 0) => {
  try {
    const state = await exports.getCompanionState(companionId);

    const now = new Date();
    const lastInteraction = state.lastInteraction ? new Date(state.lastInteraction) : null;

    // Calculer la série (streak)
    let newStreak = state.interactionStreak;
    if (lastInteraction) {
      const hoursSinceLastInteraction = (now - lastInteraction) / (1000 * 60 * 60);

      if (hoursSinceLastInteraction <= 48) {
        // Moins de 48h, continuer la série
        const daysDiff = Math.floor(hoursSinceLastInteraction / 24);
        if (daysDiff >= 1) {
          newStreak += daysDiff;
        }
      } else {
        // Plus de 48h, réinitialiser
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    const updates = {
      totalMessages: state.totalMessages + 1,
      totalInteractionTime: state.totalInteractionTime + durationMinutes,
      lastInteraction: now,
      interactionStreak: newStreak,
      longestStreak: Math.max(state.longestStreak, newStreak),
    };

    // Petite augmentation d'humeur pour interaction régulière
    if (newStreak > state.interactionStreak) {
      updates.moodScore = Math.min(1, state.moodScore + 0.05);
    }

    await state.update(updates);

    logger.info('Interaction recorded:', { companionId, streak: newStreak });

    return state;
  } catch (error) {
    logger.error('Failed to record interaction:', error);
    throw error;
  }
};

/**
 * Ajoute une préférence utilisateur apprise
 */
exports.addUserPreference = async (companionId, category, preference) => {
  try {
    const state = await exports.getCompanionState(companionId);

    const preferences = state.userPreferences || {};
    if (!preferences[category]) {
      preferences[category] = [];
    }

    if (!preferences[category].includes(preference)) {
      preferences[category].push(preference);
    }

    await state.update({ userPreferences: preferences });

    logger.info('User preference added:', { companionId, category, preference });

    return state;
  } catch (error) {
    logger.error('Failed to add user preference:', error);
    throw error;
  }
};

/**
 * Débloquer un achievement
 */
exports.unlockAchievement = async (companionId, achievementId, achievementData) => {
  try {
    const state = await exports.getCompanionState(companionId);

    const achievements = state.achievements || [];

    // Vérifier si déjà débloqué
    if (achievements.find((a) => a.id === achievementId)) {
      return state;
    }

    achievements.push({
      id: achievementId,
      unlockedAt: new Date(),
      ...achievementData,
    });

    await state.update({ achievements });

    logger.info('Achievement unlocked:', { companionId, achievementId });

    return state;
  } catch (error) {
    logger.error('Failed to unlock achievement:', error);
    throw error;
  }
};

/**
 * Obtient un résumé de la relation
 */
exports.getRelationshipSummary = async (companionId) => {
  try {
    const state = await exports.getCompanionState(companionId);

    const summary = {
      level: state.relationshipLevel,
      points: state.relationshipPoints,
      intimacy: state.intimacyLevel,
      trust: state.trust,
      affection: state.affection,
      totalMessages: state.totalMessages,
      totalTime: state.totalInteractionTime,
      currentStreak: state.interactionStreak,
      longestStreak: state.longestStreak,
      currentEmotion: state.currentEmotion,
      mood: state.mood,
      achievements: state.achievements?.length || 0,
      milestones: Object.keys(state.milestones || {}).length,
    };

    return summary;
  } catch (error) {
    logger.error('Failed to get relationship summary:', error);
    throw error;
  }
};

/**
 * Suggère une émotion basée sur le contexte
 */
exports.suggestEmotion = (sentiment, context = {}) => {
  // Sentiment: -1 (très négatif) à 1 (très positif)
  const { isGreeting = false, isFarewell = false, isQuestion = false } = context;

  if (isGreeting) {
    return sentiment > 0.3 ? 'excited' : 'happy';
  }

  if (isFarewell) {
    return sentiment > 0 ? 'content' : 'sad';
  }

  if (isQuestion) {
    return 'curious';
  }

  // Basé sur le sentiment
  if (sentiment > 0.7) return 'excited';
  if (sentiment > 0.4) return 'happy';
  if (sentiment > 0.1) return 'content';
  if (sentiment > -0.1) return 'neutral';
  if (sentiment > -0.4) return 'worried';
  if (sentiment > -0.7) return 'sad';
  return 'frustrated';
};

module.exports.RELATIONSHIP_THRESHOLDS = RELATIONSHIP_THRESHOLDS;
