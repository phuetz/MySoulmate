const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Session = sequelize.define('Session', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true
    },
    userAgent: {
      type: DataTypes.STRING,
      allowNull: true
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    lastActivityAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: true,
    indexes: [
      { name: 'sessions_userId_idx', fields: ['userId'] },
      { name: 'sessions_expiresAt_idx', fields: ['expiresAt'] },
      { name: 'sessions_lastActivityAt_idx', fields: ['lastActivityAt'] }
    ]
  });

  return Session;
};
