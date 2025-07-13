/**
 * Subscription model for user subscriptions
 */
const { DataTypes } = require('sequelize');
const { encrypt, decrypt } = require('../utils/encryption');

module.exports = (sequelize) => {
  const Subscription = sequelize.define('Subscription', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    plan: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'canceled', 'past_due'),
      defaultValue: 'active',
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastPaymentDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    nextPaymentDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {

    timestamps: true,
    hooks: {
      beforeCreate: (sub) => {
        if (sub.paymentMethod) {
          sub.paymentMethod = encrypt(sub.paymentMethod);
        }
      },
      beforeUpdate: (sub) => {
        if (sub.changed('paymentMethod')) {
          sub.paymentMethod = encrypt(sub.paymentMethod);
        }
      },
      afterFind: (result) => {
        const decryptField = (s) => {
          if (s && s.paymentMethod) {
            try {
              s.paymentMethod = decrypt(s.paymentMethod);
            } catch (err) {
              // ignore decryption errors
            }
          }
        };
        if (Array.isArray(result)) result.forEach(decryptField);
        else decryptField(result);
      }
    }
  });

  Subscription.prototype.toJSON = function () {
    const values = { ...this.get() };
    if (values.paymentMethod) {
      try {
        values.paymentMethod = decrypt(values.paymentMethod);
      } catch (err) {
        values.paymentMethod = null;
      }
    }
    return values;
  };

  return Subscription;
};
