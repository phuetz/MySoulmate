const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserStoryProgress = sequelize.define('UserStoryProgress', {
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
    storyId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'stories',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    currentChapterId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'chapters',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    completedChapterIds: {
      type: DataTypes.JSON, // Array of chapter IDs
      defaultValue: []
    },
    choicesMade: {
      type: DataTypes.JSON, // Array of {chapterId, choiceId, timestamp}
      defaultValue: []
    },
    totalAffectionGained: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    totalXpGained: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    startedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    lastPlayedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    playTime: {
      type: DataTypes.INTEGER, // seconds
      defaultValue: 0
    },
    rating: {
      type: DataTypes.INTEGER, // 1-5 stars
      allowNull: true
    }
  }, {
    tableName: 'user_story_progress',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'storyId']
      }
    ]
  });

  return UserStoryProgress;
};
