const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Gift = sequelize.define('Gift', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    price: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 0 }
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true
    },
    premium: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    category: {
      type: DataTypes.ENUM('common', 'rare', 'exclusive'),
      allowNull: false,
      defaultValue: 'common'
    },
    effect: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    indexes: [
      {
        name: 'gifts_category_idx',
        fields: ['category']
      },
      {
        name: 'gifts_price_idx',
        fields: ['price']
      }
    ]
  });

  return Gift;
};
