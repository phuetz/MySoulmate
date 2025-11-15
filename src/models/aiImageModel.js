const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AIImage = sequelize.define('AIImage', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    prompt: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    enhancedPrompt: {
      type: DataTypes.TEXT, // AI-enhanced version
      allowNull: true
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: false
    },
    thumbnailUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    provider: {
      type: DataTypes.ENUM('dalle3', 'flux', 'sdxl', 'midjourney'),
      defaultValue: 'dalle3'
    },
    style: {
      type: DataTypes.ENUM('realistic', 'anime', 'artistic', 'professional', 'fantasy', 'romantic'),
      defaultValue: 'realistic'
    },
    companionId: {
      type: DataTypes.UUID,
      allowNull: true // If generated for a specific companion
    },
    companionName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    setting: {
      type: DataTypes.STRING, // 'beach', 'cafe', 'home', etc.
      allowNull: true
    },
    outfit: {
      type: DataTypes.STRING,
      allowNull: true
    },
    pose: {
      type: DataTypes.STRING,
      allowNull: true
    },
    width: {
      type: DataTypes.INTEGER,
      defaultValue: 1024
    },
    height: {
      type: DataTypes.INTEGER,
      defaultValue: 1024
    },
    quality: {
      type: DataTypes.ENUM('standard', 'hd', 'ultra'),
      defaultValue: 'hd'
    },
    costTokens: {
      type: DataTypes.INTEGER, // Cost in user tokens/coins
      defaultValue: 50
    },
    generationTime: {
      type: DataTypes.INTEGER, // milliseconds
      allowNull: true
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isFavorite: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    likes: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    metadata: {
      type: DataTypes.JSON, // Additional generation metadata
      defaultValue: {}
    }
  }, {
    tableName: 'ai_images',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['companionId']
      },
      {
        fields: ['isPublic']
      }
    ]
  });

  return AIImage;
};
