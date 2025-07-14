const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PushToken = sequelize.define('PushToken', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'Users', key: 'id' },
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    deviceId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    platform: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    timestamps: true,
    indexes: [
      { name: 'push_token_user_idx', fields: ['userId'] },
      { name: 'push_token_idx', fields: ['token'] },
    ],
  });

  return PushToken;
};
