/**
 * AuditLog Model
 * Stores comprehensive audit trail of all system actions
 */

module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define('AuditLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      index: true,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'SET NULL',
      comment: 'User who performed the action'
    },
    action: {
      type: DataTypes.STRING(255),
      allowNull: false,
      index: true,
      comment: 'Action type (e.g., user.created, auth.login, purchase.completed)'
    },
    resource: {
      type: DataTypes.STRING(100),
      allowNull: true,
      index: true,
      comment: 'Resource type (e.g., user, subscription, product)'
    },
    resourceId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      index: true,
      comment: 'ID of the resource affected'
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: 'IP address of the user'
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'User agent string'
    },
    changes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON string of changes made (before/after)',
      get() {
        const rawValue = this.getDataValue('changes');
        return rawValue ? JSON.parse(rawValue) : null;
      },
      set(value) {
        this.setDataValue('changes', value ? JSON.stringify(value) : null);
      }
    },
    metadata: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Additional metadata as JSON',
      get() {
        const rawValue = this.getDataValue('metadata');
        return rawValue ? JSON.parse(rawValue) : null;
      },
      set(value) {
        this.setDataValue('metadata', value ? JSON.stringify(value) : null);
      }
    },
    status: {
      type: DataTypes.ENUM('success', 'error', 'warning'),
      allowNull: false,
      defaultValue: 'success',
      comment: 'Status of the action'
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Error message if action failed'
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      index: true,
      comment: 'When the action occurred'
    }
  }, {
    tableName: 'audit_logs',
    timestamps: false,
    indexes: [
      {
        name: 'idx_audit_user_timestamp',
        fields: ['userId', 'timestamp']
      },
      {
        name: 'idx_audit_action_timestamp',
        fields: ['action', 'timestamp']
      },
      {
        name: 'idx_audit_resource',
        fields: ['resource', 'resourceId']
      },
      {
        name: 'idx_audit_status',
        fields: ['status', 'timestamp']
      }
    ]
  });

  AuditLog.associate = function(models) {
    AuditLog.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return AuditLog;
};
