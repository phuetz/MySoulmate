const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Story = sequelize.define('Story', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    genre: {
      type: DataTypes.ENUM('adventure', 'romance', 'mystery', 'fantasy', 'slice-of-life'),
      allowNull: false
    },
    thumbnailUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isPremium: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    estimatedDuration: {
      type: DataTypes.INTEGER, // minutes
      defaultValue: 15
    },
    totalChapters: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    difficulty: {
      type: DataTypes.ENUM('easy', 'medium', 'hard'),
      defaultValue: 'easy'
    },
    tags: {
      type: DataTypes.JSON, // Array of tags
      defaultValue: []
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    playCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    completionCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    averageRating: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    }
  }, {
    tableName: 'stories',
    timestamps: true
  });

  return Story;
};
