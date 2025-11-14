const { DataTypes } = require('sequelize');

/**
 * Modèle Memory pour la mémoire long terme du compagnon
 * Inspiré de Replika, Zeta et Character.AI
 */
module.exports = (sequelize) => {
  const Memory = sequelize.define('Memory', {
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
      comment: 'ID du compagnon concerné',
    },
    memoryType: {
      type: DataTypes.ENUM(
        'fact',           // Fait appris sur l'utilisateur
        'preference',     // Préférence de l'utilisateur
        'event',          // Événement important
        'emotion',        // Souvenir émotionnel
        'relationship',   // Étape de la relation
        'conversation',   // Extrait de conversation marquant
        'goal',           // Objectif de l'utilisateur
        'habit',          // Habitude observée
        'interest'        // Centre d'intérêt
      ),
      allowNull: false,
      comment: 'Type de mémoire',
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Catégorie (famille, travail, loisirs, etc.)',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Contenu de la mémoire',
    },
    importance: {
      type: DataTypes.INTEGER,
      defaultValue: 5,
      validate: {
        min: 1,
        max: 10,
      },
      comment: 'Niveau d\'importance (1-10)',
    },
    emotionalWeight: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
      validate: {
        min: -1,
        max: 1,
      },
      comment: 'Poids émotionnel (-1 négatif, 0 neutre, 1 positif)',
    },
    context: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Contexte additionnel (date, lieu, personnes, etc.)',
    },
    relatedMemories: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'IDs des mémoires liées',
    },
    lastRecalled: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Dernière fois que la mémoire a été rappelée',
    },
    recallCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Nombre de fois rappelée',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Mémoire active ou archivée',
    },
    confidence: {
      type: DataTypes.FLOAT,
      defaultValue: 1.0,
      validate: {
        min: 0,
        max: 1,
      },
      comment: 'Niveau de confiance (0-1)',
    },
    source: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Source de la mémoire (conversation, profil, etc.)',
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date d\'expiration (pour mémoires temporaires)',
    },
  }, {
    timestamps: true,
    indexes: [
      {
        name: 'memories_user_companion_idx',
        fields: ['userId', 'companionId'],
      },
      {
        name: 'memories_type_idx',
        fields: ['memoryType'],
      },
      {
        name: 'memories_importance_idx',
        fields: ['importance'],
      },
      {
        name: 'memories_category_idx',
        fields: ['category'],
      },
      {
        name: 'memories_active_idx',
        fields: ['isActive'],
      },
    ],
  });

  return Memory;
};
