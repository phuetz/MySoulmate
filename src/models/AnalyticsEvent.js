/**
 * AnalyticsEvent Model
 * Stores analytics events for custom analytics and backup
 */

module.exports = (sequelize, DataTypes) => {
  const AnalyticsEvent = sequelize.define('AnalyticsEvent', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      },
      onDelete: 'SET NULL',
      comment: 'User who triggered the event (null for anonymous events)'
    },
    eventName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      index: true,
      comment: 'Name of the event (e.g., "User Signup", "Purchase")'
    },
    properties: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON string of event properties',
      get() {
        const rawValue = this.getDataValue('properties');
        return rawValue ? JSON.parse(rawValue) : {};
      },
      set(value) {
        this.setDataValue('properties', JSON.stringify(value));
      }
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      index: true,
      comment: 'When the event occurred'
    },
    sessionId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      index: true,
      comment: 'Session identifier for grouping events'
    },
    platform: {
      type: DataTypes.ENUM('web', 'ios', 'android', 'server'),
      allowNull: true,
      defaultValue: 'server',
      comment: 'Platform where the event originated'
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: 'IP address of the user (IPv4 or IPv6)'
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'User agent string from the request'
    }
  }, {
    tableName: 'analytics_events',
    timestamps: false,
    indexes: [
      {
        name: 'idx_analytics_user_timestamp',
        fields: ['userId', 'timestamp']
      },
      {
        name: 'idx_analytics_event_timestamp',
        fields: ['eventName', 'timestamp']
      },
      {
        name: 'idx_analytics_session',
        fields: ['sessionId']
      }
    ]
  });

  AnalyticsEvent.associate = function(models) {
    AnalyticsEvent.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return AnalyticsEvent;
};
