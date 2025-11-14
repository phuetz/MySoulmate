/**
 * Audit Log Model
 * Tracks sensitive operations and security events
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AuditLog = sequelize.define('AuditLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      },
      comment: 'User who performed the action (null for system actions)'
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Type of action performed (e.g., LOGIN, LOGOUT, PASSWORD_CHANGE)'
    },
    resource: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Resource affected (e.g., user:123, product:456)'
    },
    status: {
      type: DataTypes.ENUM('success', 'failure', 'pending'),
      defaultValue: 'success',
      allowNull: false
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    details: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional details about the action'
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Error message if action failed'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional metadata (request ID, session ID, etc.)'
    }
  }, {
    timestamps: true,
    updatedAt: false,
    indexes: [
      { name: 'audit_userId_idx', fields: ['userId'] },
      { name: 'audit_action_idx', fields: ['action'] },
      { name: 'audit_createdAt_idx', fields: ['createdAt'] },
      { name: 'audit_status_idx', fields: ['status'] },
      { name: 'audit_ipAddress_idx', fields: ['ipAddress'] }
    ]
  });

  return AuditLog;
};
