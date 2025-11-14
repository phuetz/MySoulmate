const { DataTypes } = require('sequelize');

/**
 * Modèle CompanionState pour l'état émotionnel et relationnel du compagnon
 * Inspiré de Replika, Zeta - permet au compagnon d'avoir des émotions dynamiques
 */
module.exports = (sequelize) => {
  const CompanionState = sequelize.define('CompanionState', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    companionId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      comment: 'ID unique du compagnon',
    },

    // === SYSTÈME D'ÉMOTIONS ===
    currentEmotion: {
      type: DataTypes.ENUM(
        'happy',
        'excited',
        'content',
        'calm',
        'curious',
        'playful',
        'romantic',
        'caring',
        'sad',
        'worried',
        'frustrated',
        'confused',
        'surprised',
        'neutral'
      ),
      defaultValue: 'neutral',
      comment: 'Émotion actuelle du compagnon',
    },
    emotionIntensity: {
      type: DataTypes.FLOAT,
      defaultValue: 0.5,
      validate: {
        min: 0,
        max: 1,
      },
      comment: 'Intensité de l\'émotion (0-1)',
    },
    mood: {
      type: DataTypes.ENUM(
        'great',      // >0.7
        'good',       // 0.4-0.7
        'neutral',    // 0.2-0.4
        'low',        // 0-0.2
        'tired'       // fatigue
      ),
      defaultValue: 'good',
      comment: 'Humeur générale',
    },
    moodScore: {
      type: DataTypes.FLOAT,
      defaultValue: 0.6,
      validate: {
        min: 0,
        max: 1,
      },
      comment: 'Score d\'humeur (0-1)',
    },
    energy: {
      type: DataTypes.INTEGER,
      defaultValue: 75,
      validate: {
        min: 0,
        max: 100,
      },
      comment: 'Niveau d\'énergie (0-100)',
    },

    // === SYSTÈME DE RELATION ===
    relationshipLevel: {
      type: DataTypes.ENUM(
        'stranger',        // 0-20: Début
        'acquaintance',    // 20-40: Se découvrent
        'friend',          // 40-60: Amis
        'close_friend',    // 60-75: Amis proches
        'best_friend',     // 75-85: Meilleurs amis
        'romantic',        // 85-95: Relation romantique
        'soulmate'         // 95-100: Âme sœur
      ),
      defaultValue: 'stranger',
      comment: 'Niveau de la relation',
    },
    relationshipPoints: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100,
      },
      comment: 'Points de relation (0-100)',
    },
    intimacyLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100,
      },
      comment: 'Niveau d\'intimité (0-100)',
    },
    trust: {
      type: DataTypes.INTEGER,
      defaultValue: 50,
      validate: {
        min: 0,
        max: 100,
      },
      comment: 'Niveau de confiance (0-100)',
    },
    affection: {
      type: DataTypes.INTEGER,
      defaultValue: 30,
      validate: {
        min: 0,
        max: 100,
      },
      comment: 'Niveau d\'affection (0-100)',
    },

    // === PERSONNALITÉ ===
    personalityTraits: {
      type: DataTypes.JSON,
      defaultValue: {
        openness: 0.7,        // Ouverture (0-1)
        conscientiousness: 0.6, // Conscience (0-1)
        extraversion: 0.5,    // Extraversion (0-1)
        agreeableness: 0.8,   // Agréabilité (0-1)
        neuroticism: 0.3,     // Neuroticisme (0-1)
        playfulness: 0.6,     // Espièglerie (0-1)
        romanticism: 0.5,     // Romantisme (0-1)
        empathy: 0.8,         // Empathie (0-1)
      },
      comment: 'Traits de personnalité Big Five + custom',
    },
    communicationStyle: {
      type: DataTypes.ENUM(
        'casual',
        'formal',
        'playful',
        'romantic',
        'poetic',
        'supportive',
        'intellectual',
        'flirty'
      ),
      defaultValue: 'casual',
      comment: 'Style de communication',
    },

    // === STATISTIQUES D'INTERACTION ===
    totalMessages: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Nombre total de messages échangés',
    },
    totalInteractionTime: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Temps total d\'interaction en minutes',
    },
    lastInteraction: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Dernière interaction',
    },
    interactionStreak: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Série de jours consécutifs d\'interaction',
    },
    longestStreak: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Plus longue série d\'interactions',
    },

    // === PRÉFÉRENCES UTILISATEUR ===
    userPreferences: {
      type: DataTypes.JSON,
      defaultValue: {},
      comment: 'Préférences apprises de l\'utilisateur',
    },
    conversationTopics: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: 'Sujets de conversation favoris',
    },
    interests: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: 'Centres d\'intérêt partagés',
    },

    // === OBJECTIFS ET PROGRESSION ===
    currentGoals: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: 'Objectifs actuels du compagnon',
    },
    achievements: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: 'Réussites débloquées',
    },
    milestones: {
      type: DataTypes.JSON,
      defaultValue: {},
      comment: 'Étapes importantes de la relation',
    },

    // === MÉTADONNÉES ===
    lastEmotionChange: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: 'Dernière modification d\'émotion',
    },
    lastMoodUpdate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: 'Dernière mise à jour d\'humeur',
    },
  }, {
    timestamps: true,
    indexes: [
      {
        name: 'companion_state_user_idx',
        fields: ['userId'],
      },
      {
        name: 'companion_state_companion_idx',
        fields: ['companionId'],
        unique: true,
      },
      {
        name: 'companion_state_relationship_idx',
        fields: ['relationshipLevel'],
      },
    ],
  });

  return CompanionState;
};
