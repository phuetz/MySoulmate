const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Choice = sequelize.define('Choice', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    chapterId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'chapters',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    nextChapterId: {
      type: DataTypes.UUID,
      allowNull: true, // null if ending
      references: {
        model: 'chapters',
        key: 'id'
      },
      onDelete: 'SET NULL'
    },
    affectionChange: {
      type: DataTypes.INTEGER, // -5 to +5
      defaultValue: 0
    },
    xpChange: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    requirements: {
      type: DataTypes.JSON, // Array of {type, value, comparison, errorMessage}
      defaultValue: []
    },
    isOptimal: {
      type: DataTypes.BOOLEAN, // Best choice indicator
      defaultValue: false
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    selectedCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'choices',
    timestamps: true,
    indexes: [
      {
        fields: ['chapterId']
      }
    ]
  });

  return Choice;
};
