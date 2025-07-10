const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserGift = sequelize.define('UserGift', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    giftId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      validate: { min: 1 }
    }
  });
  return UserGift;
};
