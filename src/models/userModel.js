/**
 * Modèle User pour la table des utilisateurs
 */
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { validatePasswordStrength, isPasswordCompromised } = require('../utils/passwordValidator');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 50]
      }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [8, 128],
        isStrongPassword(value) {
          const validation = validatePasswordStrength(value);
          if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
          }
          if (isPasswordCompromised(value)) {
            throw new Error('Ce mot de passe est trop commun et a été compromis');
          }
        }
      }
    },
    role: {
      type: DataTypes.ENUM('user', 'admin'),
      defaultValue: 'user'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    },
    passwordResetToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    refreshToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    refreshTokenExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    emailVerificationToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    deletionRequestedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Timestamp when user requested account deletion'
    },
    deletionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Reason provided for account deletion'
    },
    twoFactorEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether two-factor authentication is enabled'
    },
    twoFactorSecret: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'TOTP secret for Google Authenticator'
    },
    twoFactorMethod: {
      type: DataTypes.ENUM('totp', 'email'),
      allowNull: true,
      comment: 'Two-factor authentication method'
    },
    twoFactorBackupCodes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of hashed backup codes'
    },
    stripeCustomerId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Stripe customer ID'
    },
    subscriptionId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Active Stripe subscription ID'
    },
    subscriptionStatus: {
      type: DataTypes.ENUM('active', 'canceled', 'past_due', 'unpaid', 'trialing'),
      allowNull: true,
      comment: 'Stripe subscription status'
    },
    subscriptionPlan: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Stripe price ID'
    },
    subscriptionTier: {
      type: DataTypes.ENUM('user', 'premium', 'ultimate'),
      defaultValue: 'user',
      comment: 'Subscription tier for RBAC'
    },
    subscriptionCurrentPeriodEnd: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'End of current billing period'
    },
    subscriptionCancelAtPeriodEnd: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether subscription will cancel at period end'
    },
    subscriptionCancelAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Date when subscription will be canceled'
    }
  }, {
    timestamps: true,
    indexes: [
      {
        name: 'users_email_idx',
        fields: ['email']
      },
      {
        name: 'users_lastLogin_idx',
        fields: ['lastLogin']
      }
    ],
    hooks: {
      // Hacher le mot de passe avant de l'enregistrer
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  });

  // Méthode pour vérifier si le mot de passe est correct
  User.prototype.isPasswordValid = async function(password) {
    return await bcrypt.compare(password, this.password);
  };

  // Alias pour compatibilité
  User.prototype.comparePassword = User.prototype.isPasswordValid;

  // Méthode pour renvoyer l'utilisateur sans le mot de passe
  User.prototype.toJSON = function() {
    const values = { ...this.get() };
    delete values.password;
    delete values.twoFactorSecret;
    delete values.twoFactorBackupCodes;
    return values;
  };

  return User;
};