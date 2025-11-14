/**
 * Feature Flags Service
 * Enables/disables features dynamically without code deployment
 */

const logger = require('../config/logger');

class FeatureFlagsService {
  constructor() {
    this.flags = new Map();
    this.userFlags = new Map(); // User-specific overrides
    this.isInitialized = false;
  }

  /**
   * Initialize feature flags from database or config
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Load flags from database
      const { FeatureFlag } = require('../models');
      const flags = await FeatureFlag.findAll();

      flags.forEach(flag => {
        this.flags.set(flag.key, {
          enabled: flag.enabled,
          description: flag.description,
          rolloutPercentage: flag.rolloutPercentage || 100,
          allowedUsers: flag.allowedUsers ? JSON.parse(flag.allowedUsers) : [],
          allowedRoles: flag.allowedRoles ? JSON.parse(flag.allowedRoles) : [],
          metadata: flag.metadata ? JSON.parse(flag.metadata) : {}
        });
      });

      this.isInitialized = true;
      logger.info(`Feature flags initialized: ${this.flags.size} flags loaded`);
    } catch (error) {
      logger.error('Failed to initialize feature flags:', error);
      // Set default flags if DB fails
      this.setDefaultFlags();
    }
  }

  /**
   * Set default feature flags
   */
  setDefaultFlags() {
    const defaults = {
      '2fa': { enabled: true, description: 'Two-factor authentication' },
      'websocket': { enabled: true, description: 'WebSocket real-time features' },
      'analytics': { enabled: true, description: 'Analytics tracking' },
      'ai_chat': { enabled: true, description: 'AI chat feature' },
      'voice_calls': { enabled: true, description: 'Voice call feature' },
      'video_calls': { enabled: true, description: 'Video call feature' },
      'ar_features': { enabled: false, description: 'AR features (beta)' },
      'gifts': { enabled: true, description: 'Virtual gifts' },
      'subscriptions': { enabled: true, description: 'Premium subscriptions' },
      'marketplace': { enabled: false, description: 'Marketplace (coming soon)' },
      'social_sharing': { enabled: true, description: 'Social media sharing' },
      'referral_program': { enabled: false, description: 'Referral program (beta)' },
      'advanced_analytics': { enabled: false, description: 'Advanced analytics dashboard' },
      'maintenance_mode': { enabled: false, description: 'Maintenance mode' }
    };

    Object.entries(defaults).forEach(([key, value]) => {
      this.flags.set(key, { ...value, rolloutPercentage: 100, allowedUsers: [], allowedRoles: [] });
    });

    this.isInitialized = true;
  }

  /**
   * Check if a feature is enabled for a user
   */
  isEnabled(featureKey, userId = null, userRole = null) {
    const flag = this.flags.get(featureKey);

    if (!flag) {
      logger.warn(`Feature flag not found: ${featureKey}`);
      return false; // Fail closed
    }

    // Global disable
    if (!flag.enabled) {
      return false;
    }

    // Check user-specific override
    if (userId && this.userFlags.has(`${featureKey}:${userId}`)) {
      return this.userFlags.get(`${featureKey}:${userId}`);
    }

    // Check if user is in allowed list
    if (userId && flag.allowedUsers.length > 0) {
      return flag.allowedUsers.includes(userId);
    }

    // Check if role is in allowed list
    if (userRole && flag.allowedRoles.length > 0) {
      return flag.allowedRoles.includes(userRole);
    }

    // Check rollout percentage
    if (flag.rolloutPercentage < 100) {
      if (!userId) return false; // Need user ID for rollout
      return this.isInRollout(userId, flag.rolloutPercentage);
    }

    return true;
  }

  /**
   * Determine if user is in rollout percentage
   */
  isInRollout(userId, percentage) {
    // Consistent hashing to ensure same user always gets same result
    const hash = this.hashUserId(userId);
    return (hash % 100) < percentage;
  }

  /**
   * Simple hash function for user ID
   */
  hashUserId(userId) {
    let hash = 0;
    const str = userId.toString();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Enable a feature flag
   */
  async enable(featureKey) {
    const flag = this.flags.get(featureKey);
    if (flag) {
      flag.enabled = true;
      this.flags.set(featureKey, flag);

      // Update database
      await this.updateDatabase(featureKey, { enabled: true });
      logger.info(`Feature flag enabled: ${featureKey}`);
    }
  }

  /**
   * Disable a feature flag
   */
  async disable(featureKey) {
    const flag = this.flags.get(featureKey);
    if (flag) {
      flag.enabled = false;
      this.flags.set(featureKey, flag);

      // Update database
      await this.updateDatabase(featureKey, { enabled: false });
      logger.info(`Feature flag disabled: ${featureKey}`);
    }
  }

  /**
   * Set rollout percentage
   */
  async setRollout(featureKey, percentage) {
    const flag = this.flags.get(featureKey);
    if (flag) {
      flag.rolloutPercentage = Math.max(0, Math.min(100, percentage));
      this.flags.set(featureKey, flag);

      await this.updateDatabase(featureKey, { rolloutPercentage: flag.rolloutPercentage });
      logger.info(`Feature flag rollout updated: ${featureKey} = ${percentage}%`);
    }
  }

  /**
   * Add user to allowed list
   */
  async addAllowedUser(featureKey, userId) {
    const flag = this.flags.get(featureKey);
    if (flag && !flag.allowedUsers.includes(userId)) {
      flag.allowedUsers.push(userId);
      this.flags.set(featureKey, flag);

      await this.updateDatabase(featureKey, { allowedUsers: JSON.stringify(flag.allowedUsers) });
      logger.info(`User ${userId} added to feature ${featureKey}`);
    }
  }

  /**
   * Set user-specific override
   */
  setUserOverride(featureKey, userId, enabled) {
    this.userFlags.set(`${featureKey}:${userId}`, enabled);
    logger.info(`User override set: ${featureKey} for user ${userId} = ${enabled}`);
  }

  /**
   * Update database
   */
  async updateDatabase(featureKey, updates) {
    try {
      const { FeatureFlag } = require('../models');
      await FeatureFlag.upsert({
        key: featureKey,
        ...updates,
        updatedAt: new Date()
      });
    } catch (error) {
      logger.error(`Failed to update feature flag ${featureKey}:`, error);
    }
  }

  /**
   * Create a new feature flag
   */
  async create(featureKey, description, enabled = false) {
    try {
      const { FeatureFlag } = require('../models');
      await FeatureFlag.create({
        key: featureKey,
        description,
        enabled,
        rolloutPercentage: 100,
        allowedUsers: '[]',
        allowedRoles: '[]'
      });

      this.flags.set(featureKey, {
        enabled,
        description,
        rolloutPercentage: 100,
        allowedUsers: [],
        allowedRoles: [],
        metadata: {}
      });

      logger.info(`Feature flag created: ${featureKey}`);
    } catch (error) {
      logger.error(`Failed to create feature flag ${featureKey}:`, error);
    }
  }

  /**
   * Get all feature flags
   */
  getAll() {
    const flags = {};
    this.flags.forEach((value, key) => {
      flags[key] = value;
    });
    return flags;
  }

  /**
   * Get flags for a specific user
   */
  getUserFlags(userId, userRole = null) {
    const userFlags = {};
    this.flags.forEach((value, key) => {
      userFlags[key] = this.isEnabled(key, userId, userRole);
    });
    return userFlags;
  }

  /**
   * Middleware to attach feature flags to request
   */
  middleware() {
    return (req, res, next) => {
      const userId = req.user ? req.user.id : null;
      const userRole = req.user ? req.user.role : null;

      req.isFeatureEnabled = (featureKey) => {
        return this.isEnabled(featureKey, userId, userRole);
      };

      req.getFeatureFlags = () => {
        return this.getUserFlags(userId, userRole);
      };

      next();
    };
  }

  /**
   * Reload flags from database
   */
  async reload() {
    this.isInitialized = false;
    this.flags.clear();
    await this.initialize();
  }
}

// Singleton instance
const featureFlagsService = new FeatureFlagsService();

// Auto-initialize
featureFlagsService.initialize().catch(err => {
  logger.error('Feature flags auto-initialization failed:', err);
});

module.exports = featureFlagsService;
