const { DataTypes } = require('sequelize');

/**
 * Modèle Conversation pour stocker les conversations avec analyse
 */
module.exports = (sequelize) => {
  const Conversation = sequelize.define('Conversation', {
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
      comment: 'ID du compagnon',
    },
    userMessage: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Message de l\'utilisateur',
    },
    companionResponse: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Réponse du compagnon',
    },
    sentiment: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Score de sentiment (-1 à 1)',
    },
    emotion: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Émotion détectée',
    },
    intent: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Intention détectée',
    },
    context: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Contexte de la conversation',
    },
    durationSeconds: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Durée de la conversation en secondes',
    },
  }, {
    timestamps: true,
    indexes: [
      {
        name: 'conversations_user_companion_idx',
        fields: ['userId', 'companionId'],
      },
      {
        name: 'conversations_created_idx',
        fields: ['createdAt'],
      },
    ],
  });

  return Conversation;
};
