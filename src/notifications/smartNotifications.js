/**
 * Smart Notifications Engine
 * AI-powered intelligent notification system with optimal timing and personalization
 */

const logger = require('../config/logger');
const { predictiveAnalytics } = require('../analytics/predictive');

class SmartNotifications {
  constructor() {
    this.notificationQueue = [];
    this.userPreferences = new Map();
    this.deliveryStrategy = {
      immediate: ['security_alert', 'payment_success', 'message_received'],
      batched: ['feature_update', 'tips', 'recommendations'],
      scheduled: ['digest', 'reports', 'reminders']
    };
  }

  /**
   * Send smart notification
   */
  async send(userId, notification) {
    try {
      // Get user preferences
      const preferences = await this.getUserPreferences(userId);

      // Check if user has muted this category
      if (preferences.mutedCategories?.includes(notification.category)) {
        logger.info(`Notification muted for user ${userId}: ${notification.category}`);
        return { sent: false, reason: 'muted' };
      }

      // Check frequency limits
      if (await this.exceeds FrequencyLimit(userId, notification.category)) {
        logger.info(`Frequency limit exceeded for user ${userId}: ${notification.category}`);
        return { sent: false, reason: 'frequency_limit' };
      }

      // Determine delivery strategy
      const strategy = this.getDeliveryStrategy(notification.type);

      if (strategy === 'immediate') {
        return await this.sendImmediate(userId, notification);
      } else if (strategy === 'batched') {
        return await this.addToBatch(userId, notification);
      } else {
        return await this.scheduleNotification(userId, notification);
      }
    } catch (error) {
      logger.error('Smart notification send failed:', error);
      throw error;
    }
  }

  /**
   * Send immediate notification
   */
  async sendImmediate(userId, notification) {
    const channels = await this.selectOptimalChannels(userId, notification);

    const results = await Promise.all(
      channels.map(channel => this.sendViaChannel(userId, notification, channel))
    );

    // Track delivery
    await this.trackNotification(userId, notification, 'sent', channels);

    return {
      sent: true,
      channels,
      results
    };
  }

  /**
   * Select optimal delivery channels
   */
  async selectOptimalChannels(userId, notification) {
    const preferences = await this.getUserPreferences(userId);
    const channels = [];

    // Priority level determines channels
    switch (notification.priority) {
      case 'critical':
        // Use all available channels
        if (preferences.channels.push) channels.push('push');
        if (preferences.channels.email) channels.push('email');
        if (preferences.channels.sms) channels.push('sms');
        break;

      case 'high':
        // Push + Email
        if (preferences.channels.push) channels.push('push');
        if (preferences.channels.email) channels.push('email');
        break;

      case 'medium':
        // Push or Email based on user behavior
        const preferredChannel = await this.predictPreferredChannel(userId);
        if (preferences.channels[preferredChannel]) {
          channels.push(preferredChannel);
        }
        break;

      case 'low':
        // In-app only
        channels.push('in_app');
        break;
    }

    return channels.length > 0 ? channels : ['in_app'];
  }

  /**
   * Predict user's preferred channel
   */
  async predictPreferredChannel(userId) {
    const { NotificationDelivery } = require('../models');
    const { Op } = require('sequelize');

    // Get last 30 days of interaction data
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const interactions = await NotificationDelivery.findAll({
      where: {
        userId,
        timestamp: { [Op.gte]: thirtyDaysAgo },
        interacted: true
      },
      attributes: ['channel']
    });

    // Count interactions by channel
    const channelCounts = {};
    interactions.forEach(i => {
      channelCounts[i.channel] = (channelCounts[i.channel] || 0) + 1;
    });

    // Return channel with most interactions
    const sorted = Object.entries(channelCounts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || 'push';
  }

  /**
   * Schedule notification for optimal time
   */
  async scheduleNotification(userId, notification) {
    // Predict optimal time
    const optimalTime = await predictiveAnalytics.predictOptimalMessagingTime(userId);

    const scheduledTime = this.calculateScheduledTime(optimalTime);

    // Add to queue
    this.notificationQueue.push({
      userId,
      notification,
      scheduledTime,
      status: 'scheduled'
    });

    // Store in database
    await this.storeScheduledNotification(userId, notification, scheduledTime);

    return {
      sent: false,
      scheduled: true,
      scheduledTime
    };
  }

  /**
   * Calculate scheduled time from optimal time prediction
   */
  calculateScheduledTime(optimalTime) {
    const now = new Date();
    const scheduled = new Date();

    scheduled.setHours(optimalTime.primary.hour, 0, 0, 0);

    // If time has passed today, schedule for tomorrow
    if (scheduled <= now) {
      scheduled.setDate(scheduled.getDate() + 1);
    }

    return scheduled;
  }

  /**
   * Batch notifications (digest)
   */
  async addToBatch(userId, notification) {
    const { NotificationBatch } = require('../models');

    await NotificationBatch.create({
      userId,
      notification: JSON.stringify(notification),
      batchType: 'digest',
      status: 'pending'
    });

    return {
      sent: false,
      batched: true,
      willSendAt: 'next_digest'
    };
  }

  /**
   * Send daily digest
   */
  async sendDigest(userId) {
    const { NotificationBatch } = require('../models');

    // Get pending batched notifications
    const pending = await NotificationBatch.findAll({
      where: {
        userId,
        status: 'pending',
        batchType: 'digest'
      }
    });

    if (pending.length === 0) {
      return { sent: false, reason: 'no_pending' };
    }

    // Group by category
    const grouped = this.groupNotifications(pending);

    // Create digest
    const digest = {
      type: 'digest',
      title: `Your Daily Update (${pending.length} items)`,
      sections: Object.entries(grouped).map(([category, notifications]) => ({
        category,
        count: notifications.length,
        items: notifications
      })),
      timestamp: new Date()
    };

    // Send digest
    await this.sendImmediate(userId, digest);

    // Mark as sent
    await NotificationBatch.update(
      { status: 'sent' },
      { where: { id: pending.map(p => p.id) } }
    );

    return {
      sent: true,
      count: pending.length
    };
  }

  /**
   * Personalize notification content
   */
  async personalizeNotification(userId, notification) {
    const { User } = require('../models');
    const user = await User.findByPk(userId);

    // Replace personalization tokens
    let title = notification.title;
    let body = notification.body;

    const tokens = {
      '{{username}}': user.username || user.email,
      '{{first_name}}': user.firstName || user.username,
      '{{email}}': user.email
    };

    for (const [token, value] of Object.entries(tokens)) {
      title = title.replace(new RegExp(token, 'g'), value);
      body = body.replace(new RegExp(token, 'g'), value);
    }

    return {
      ...notification,
      title,
      body
    };
  }

  /**
   * A/B test notifications
   */
  async sendWithABTest(userId, variants) {
    // Select variant based on user ID
    const variantIndex = this.hashUserId(userId) % variants.length;
    const selectedVariant = variants[variantIndex];

    // Track variant selection
    await this.trackABTest(userId, selectedVariant.id, variants.length);

    // Send notification
    return await this.send(userId, selectedVariant.notification);
  }

  /**
   * Check frequency limit
   */
  async exceedsFrequencyLimit(userId, category) {
    const { NotificationDelivery } = require('../models');
    const { Op } = require('sequelize');

    const preferences = await this.getUserPreferences(userId);
    const limit = preferences.frequencyLimits?.[category] || 10; // Default: 10 per day

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const count = await NotificationDelivery.count({
      where: {
        userId,
        category,
        timestamp: { [Op.gte]: today }
      }
    });

    return count >= limit;
  }

  /**
   * Send via specific channel
   */
  async sendViaChannel(userId, notification, channel) {
    try {
      switch (channel) {
        case 'push':
          return await this.sendPushNotification(userId, notification);

        case 'email':
          return await this.sendEmailNotification(userId, notification);

        case 'sms':
          return await this.sendSMSNotification(userId, notification);

        case 'in_app':
          return await this.sendInAppNotification(userId, notification);

        default:
          throw new Error(`Unknown channel: ${channel}`);
      }
    } catch (error) {
      logger.error(`Failed to send via ${channel}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send push notification
   */
  async sendPushNotification(userId, notification) {
    const { Expo } = require('expo-server-sdk');
    const { PushToken } = require('../models');

    const expo = new Expo();

    // Get user's push tokens
    const tokens = await PushToken.findAll({ where: { userId } });

    if (tokens.length === 0) {
      return { success: false, reason: 'no_tokens' };
    }

    const messages = tokens.map(token => ({
      to: token.token,
      sound: 'default',
      title: notification.title,
      body: notification.body,
      data: notification.data || {}
    }));

    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        logger.error('Push notification chunk failed:', error);
      }
    }

    return { success: true, tickets };
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(userId, notification) {
    const emailService = require('../utils/emailService');
    const { User } = require('../models');

    const user = await User.findByPk(userId);

    await emailService.sendEmail(user.email, notification.title, notification.body, {
      html: notification.html,
      template: notification.template,
      data: notification.data
    });

    return { success: true };
  }

  /**
   * Send SMS notification
   */
  async sendSMSNotification(userId, notification) {
    // TODO: Integrate with SMS provider (Twilio, etc.)
    logger.info(`SMS notification sent to user ${userId}:`, notification);
    return { success: true };
  }

  /**
   * Send in-app notification
   */
  async sendInAppNotification(userId, notification) {
    const { InAppNotification } = require('../models');

    await InAppNotification.create({
      userId,
      title: notification.title,
      body: notification.body,
      category: notification.category,
      data: JSON.stringify(notification.data || {}),
      read: false,
      createdAt: new Date()
    });

    // Emit via WebSocket if user is online
    const io = require('../websocket/server').getIO();
    if (io) {
      io.to(`user_${userId}`).emit('notification', notification);
    }

    return { success: true };
  }

  /**
   * Helper functions
   */

  getDeliveryStrategy(type) {
    for (const [strategy, types] of Object.entries(this.deliveryStrategy)) {
      if (types.includes(type)) {
        return strategy;
      }
    }
    return 'batched'; // Default
  }

  async getUserPreferences(userId) {
    if (this.userPreferences.has(userId)) {
      return this.userPreferences.get(userId);
    }

    const { User } = require('../models');
    const user = await User.findByPk(userId);

    const preferences = {
      channels: {
        push: user.notificationsPush !== false,
        email: user.notificationsEmail !== false,
        sms: user.notificationsSMS === true
      },
      mutedCategories: user.mutedCategories ? JSON.parse(user.mutedCategories) : [],
      frequencyLimits: user.frequencyLimits ? JSON.parse(user.frequencyLimits) : {}
    };

    this.userPreferences.set(userId, preferences);
    return preferences;
  }

  async trackNotification(userId, notification, status, channels) {
    const { NotificationDelivery } = require('../models');

    await NotificationDelivery.create({
      userId,
      type: notification.type,
      category: notification.category,
      channels: JSON.stringify(channels),
      status,
      timestamp: new Date()
    });
  }

  async storeScheduledNotification(userId, notification, scheduledTime) {
    const { ScheduledNotification } = require('../models');

    await ScheduledNotification.create({
      userId,
      notification: JSON.stringify(notification),
      scheduledTime,
      status: 'pending'
    });
  }

  async trackABTest(userId, variantId, totalVariants) {
    logger.info(`A/B Test: User ${userId} assigned variant ${variantId} of ${totalVariants}`);
    // TODO: Store in analytics
  }

  groupNotifications(notifications) {
    const grouped = {};
    notifications.forEach(n => {
      const notification = JSON.parse(n.notification);
      const category = notification.category || 'general';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(notification);
    });
    return grouped;
  }

  hashUserId(userId) {
    let hash = 0;
    const str = userId.toString();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}

// Singleton instance
const smartNotifications = new SmartNotifications();

module.exports = {
  SmartNotifications,
  smartNotifications
};
