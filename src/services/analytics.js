/**
 * Analytics Service
 * Provides unified analytics tracking across multiple providers
 * Supports: Mixpanel, Google Analytics, Custom Analytics
 */

const logger = require('../config/logger');

class AnalyticsService {
  constructor() {
    this.providers = [];
    this.isInitialized = false;
    this.eventQueue = [];
    this.userProperties = {};
  }

  /**
   * Initialize analytics providers
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize Mixpanel if token provided
      if (process.env.MIXPANEL_TOKEN) {
        const Mixpanel = require('mixpanel');
        this.mixpanel = Mixpanel.init(process.env.MIXPANEL_TOKEN, {
          protocol: 'https'
        });
        this.providers.push('mixpanel');
        logger.info('Mixpanel analytics initialized');
      }

      // Initialize Google Analytics if ID provided
      if (process.env.GA_MEASUREMENT_ID) {
        // Server-side GA4 tracking
        this.gaMeasurementId = process.env.GA_MEASUREMENT_ID;
        this.gaApiSecret = process.env.GA_API_SECRET;
        this.providers.push('google-analytics');
        logger.info('Google Analytics 4 initialized');
      }

      // Custom analytics always available
      this.providers.push('custom');

      this.isInitialized = true;

      // Process queued events
      await this.processQueue();

      logger.info(`Analytics initialized with providers: ${this.providers.join(', ')}`);
    } catch (error) {
      logger.error('Analytics initialization error:', error);
    }
  }

  /**
   * Track an event
   * @param {string} userId - User ID (can be null for anonymous events)
   * @param {string} eventName - Event name
   * @param {Object} properties - Event properties
   */
  async track(userId, eventName, properties = {}) {
    const event = {
      userId,
      eventName,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        platform: properties.platform || 'server'
      }
    };

    if (!this.isInitialized) {
      this.eventQueue.push(event);
      return;
    }

    try {
      // Track to Mixpanel
      if (this.mixpanel) {
        const distinctId = userId || 'anonymous';
        this.mixpanel.track(eventName, {
          distinct_id: distinctId,
          ...event.properties
        });
      }

      // Track to Google Analytics 4
      if (this.gaMeasurementId && this.gaApiSecret) {
        await this.trackGA4(userId, eventName, event.properties);
      }

      // Track to custom analytics (database)
      await this.trackCustom(event);

      logger.debug(`Event tracked: ${eventName}`, { userId, properties });
    } catch (error) {
      logger.error('Analytics tracking error:', error);
    }
  }

  /**
   * Track to Google Analytics 4 via Measurement Protocol
   */
  async trackGA4(userId, eventName, properties) {
    try {
      const axios = require('axios');
      const clientId = userId || this.generateClientId();

      const payload = {
        client_id: clientId,
        user_id: userId,
        events: [{
          name: eventName.replace(/\s/g, '_').toLowerCase(),
          params: this.sanitizeGA4Properties(properties)
        }]
      };

      await axios.post(
        `https://www.google-analytics.com/mp/collect?measurement_id=${this.gaMeasurementId}&api_secret=${this.gaApiSecret}`,
        payload,
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } catch (error) {
      logger.error('GA4 tracking error:', error.message);
    }
  }

  /**
   * Track to custom analytics database
   */
  async trackCustom(event) {
    try {
      const { AnalyticsEvent } = require('../models');

      await AnalyticsEvent.create({
        userId: event.userId,
        eventName: event.eventName,
        properties: JSON.stringify(event.properties),
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Custom analytics tracking error:', error.message);
    }
  }

  /**
   * Identify a user (set user properties)
   */
  async identify(userId, properties = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      this.userProperties[userId] = properties;

      // Mixpanel people properties
      if (this.mixpanel) {
        this.mixpanel.people.set(userId, {
          ...properties,
          $last_seen: new Date().toISOString()
        });
      }

      // Store in database
      const { User } = require('../models');
      await User.update(
        { analyticsProperties: JSON.stringify(properties) },
        { where: { id: userId } }
      );

      logger.debug(`User identified: ${userId}`, properties);
    } catch (error) {
      logger.error('Analytics identify error:', error);
    }
  }

  /**
   * Track page/screen view
   */
  async trackPageView(userId, pageName, properties = {}) {
    await this.track(userId, 'Page View', {
      page_name: pageName,
      ...properties
    });
  }

  /**
   * Track user signup
   */
  async trackSignup(userId, properties = {}) {
    await this.track(userId, 'User Signup', {
      signup_method: properties.method || 'email',
      ...properties
    });
  }

  /**
   * Track user login
   */
  async trackLogin(userId, properties = {}) {
    await this.track(userId, 'User Login', {
      login_method: properties.method || 'email',
      ...properties
    });
  }

  /**
   * Track subscription events
   */
  async trackSubscription(userId, action, properties = {}) {
    await this.track(userId, `Subscription ${action}`, {
      subscription_tier: properties.tier,
      subscription_price: properties.price,
      ...properties
    });
  }

  /**
   * Track purchase/transaction
   */
  async trackPurchase(userId, properties = {}) {
    await this.track(userId, 'Purchase', {
      product_id: properties.productId,
      product_name: properties.productName,
      revenue: properties.revenue,
      currency: properties.currency || 'USD',
      ...properties
    });

    // Track revenue to Mixpanel
    if (this.mixpanel && properties.revenue) {
      this.mixpanel.people.track_charge(userId, properties.revenue);
    }
  }

  /**
   * Track AI interaction
   */
  async trackAIInteraction(userId, properties = {}) {
    await this.track(userId, 'AI Interaction', {
      interaction_type: properties.type, // chat, voice, video
      message_count: properties.messageCount,
      duration: properties.duration,
      ...properties
    });
  }

  /**
   * Track feature usage
   */
  async trackFeatureUsage(userId, featureName, properties = {}) {
    await this.track(userId, 'Feature Used', {
      feature_name: featureName,
      ...properties
    });
  }

  /**
   * Track error
   */
  async trackError(userId, error, properties = {}) {
    await this.track(userId, 'Error Occurred', {
      error_message: error.message,
      error_stack: error.stack,
      error_code: properties.code,
      ...properties
    });
  }

  /**
   * Increment user property
   */
  async increment(userId, property, value = 1) {
    if (this.mixpanel) {
      this.mixpanel.people.increment(userId, property, value);
    }
  }

  /**
   * Process queued events
   */
  async processQueue() {
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      await this.track(event.userId, event.eventName, event.properties);
    }
  }

  /**
   * Sanitize properties for GA4 (max 25 properties, specific types)
   */
  sanitizeGA4Properties(properties) {
    const sanitized = {};
    let count = 0;

    for (const [key, value] of Object.entries(properties)) {
      if (count >= 25) break;

      const sanitizedKey = key.replace(/[^a-zA-Z0-9_]/g, '_');

      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        sanitized[sanitizedKey] = value;
        count++;
      }
    }

    return sanitized;
  }

  /**
   * Generate client ID for anonymous users
   */
  generateClientId() {
    return `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get analytics summary for a user
   */
  async getUserAnalytics(userId, startDate, endDate) {
    try {
      const { AnalyticsEvent } = require('../models');
      const { Op } = require('sequelize');

      const events = await AnalyticsEvent.findAll({
        where: {
          userId,
          timestamp: {
            [Op.between]: [startDate, endDate]
          }
        },
        order: [['timestamp', 'DESC']]
      });

      return {
        totalEvents: events.length,
        events: events.map(e => ({
          name: e.eventName,
          properties: JSON.parse(e.properties),
          timestamp: e.timestamp
        }))
      };
    } catch (error) {
      logger.error('Get user analytics error:', error);
      return { totalEvents: 0, events: [] };
    }
  }
}

// Singleton instance
const analyticsService = new AnalyticsService();

// Auto-initialize if env vars are set
if (process.env.MIXPANEL_TOKEN || process.env.GA_MEASUREMENT_ID) {
  analyticsService.initialize().catch(err => {
    logger.error('Analytics auto-initialization failed:', err);
  });
}

module.exports = analyticsService;
