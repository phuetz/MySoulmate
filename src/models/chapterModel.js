const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Chapter = sequelize.define('Chapter', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
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
    chapterNumber: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    backgroundMusicUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    affectionImpact: {
      type: DataTypes.INTEGER, // -10 to +10
      defaultValue: 0
    },
    xpReward: {
      type: DataTypes.INTEGER,
      defaultValue: 50
    },
    isEnding: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isStart: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    tableName: 'chapters',
    timestamps: true,
    indexes: [
      {
        fields: ['storyId', 'chapterNumber']
      }
    ]
  });

  return Chapter;
};
