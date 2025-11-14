/**
 * FeatureFlag Model
 * Stores feature flag configurations
 */

module.exports = (sequelize, DataTypes) => {
  const FeatureFlag = sequelize.define('FeatureFlag', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    key: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      comment: 'Unique feature flag key'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Description of what this feature does'
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether the feature is globally enabled'
    },
    rolloutPercentage: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
      validate: {
        min: 0,
        max: 100
      },
      comment: 'Percentage of users who have access (0-100)'
    },
    allowedUsers: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of user IDs who have explicit access',
      get() {
        const rawValue = this.getDataValue('allowedUsers');
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue('allowedUsers', JSON.stringify(value));
      }
    },
    allowedRoles: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of roles who have access',
      get() {
        const rawValue = this.getDataValue('allowedRoles');
        return rawValue ? JSON.parse(rawValue) : [];
      },
      set(value) {
        this.setDataValue('allowedRoles', JSON.stringify(value));
      }
    },
    metadata: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Additional metadata as JSON',
      get() {
        const rawValue = this.getDataValue('metadata');
        return rawValue ? JSON.parse(rawValue) : {};
      },
      set(value) {
        this.setDataValue('metadata', JSON.stringify(value));
      }
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'feature_flags',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['key']
      }
    ]
  });

  return FeatureFlag;
};
