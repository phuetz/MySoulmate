const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DailyStreak = sequelize.define('DailyStreak', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    currentStreak: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    longestStreak: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    lastCheckIn: {
      type: DataTypes.DATE,
      allowNull: true
    },
    checkInHistory: {
      type: DataTypes.JSON, // Array of dates
      defaultValue: []
    },
    totalCoinsEarned: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    totalXpEarned: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    milestonesClaimed: {
      type: DataTypes.JSON, // Array of milestone days claimed [3, 7, 14, etc.]
      defaultValue: []
    }
  }, {
    tableName: 'daily_streaks',
    timestamps: true
  });

  return DailyStreak;
};
