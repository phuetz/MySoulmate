/**
 * Feature Flags System
 * Allows enabling/disabling features dynamically without code deployment
 */
const logger = require('./logger');

// Default feature flags configuration
const defaultFlags = {
  // AI Features
  ai_streaming: false,
  ai_gpt4: false,
  ai_voice_generation: false,
  ai_image_generation: true,

  // Premium Features
  premium_ar_view: true,
  premium_video_calls: true,
  premium_nsfw_content: true,
  premium_custom_personality: true,

  // Social Features
  user_messaging: false,
  user_profiles_public: false,
  social_sharing: false,

  // Experimental Features
  experimental_blockchain: false,
  experimental_web3: false,
  experimental_voice_cloning: false,

  // Security Features
  two_factor_auth: false,
  biometric_auth: true,
  session_recording: false,

  // Monitoring & Analytics
  detailed_analytics: true,
  performance_monitoring: true,
  error_tracking: true,

  // Payment Features
  stripe_payments: true,
  crypto_payments: false,
  subscription_tiers: true,

  // Content Features
  user_generated_content: false,
  content_moderation: true,
  auto_translation: false,

  // Mobile Features
  offline_mode: false,
  push_notifications: true,
  deep_linking: true,
  widgets: false
};

// Store for feature flags (in production, use Redis or database)
let featureFlags = { ...defaultFlags };

// User-specific overrides (userId -> flags object)
const userOverrides = new Map();

// Role-based overrides
const roleOverrides = {
  admin: {
    ai_gpt4: true,
    detailed_analytics: true,
    session_recording: true,
    experimental_blockchain: true
  },
  premium: {
    ai_streaming: true,
    ai_gpt4: true,
    premium_ar_view: true,
    premium_video_calls: true
  }
};

/**
 * Check if a feature is enabled
 * @param {string} featureName - Name of the feature
 * @param {Object} context - Context (user, role, etc.)
 * @returns {boolean} Feature is enabled
 */
exports.isEnabled = (featureName, context = {}) => {
  // Check user-specific override first
  if (context.userId) {
    const userFlags = userOverrides.get(context.userId);
    if (userFlags && featureName in userFlags) {
      return userFlags[featureName];
    }
  }

  // Check role-based override
  if (context.role && roleOverrides[context.role]) {
    const roleFlags = roleOverrides[context.role];
    if (featureName in roleFlags) {
      return roleFlags[featureName];
    }
  }

  // Check global flag
  if (featureName in featureFlags) {
    return featureFlags[featureName];
  }

  // Default to false for unknown features
  logger.warn(`Unknown feature flag: ${featureName}`);
  return false;
};

/**
 * Enable a feature globally
 * @param {string} featureName - Name of the feature
 */
exports.enable = (featureName) => {
  featureFlags[featureName] = true;
  logger.info(`Feature enabled: ${featureName}`);
};

/**
 * Disable a feature globally
 * @param {string} featureName - Name of the feature
 */
exports.disable = (featureName) => {
  featureFlags[featureName] = false;
  logger.info(`Feature disabled: ${featureName}`);
};

/**
 * Set feature flag value
 * @param {string} featureName - Name of the feature
 * @param {boolean} value - Feature value
 */
exports.setFlag = (featureName, value) => {
  featureFlags[featureName] = value;
  logger.info(`Feature flag set: ${featureName} = ${value}`);
};

/**
 * Enable feature for specific user
 * @param {string} userId - User ID
 * @param {string} featureName - Name of the feature
 */
exports.enableForUser = (userId, featureName) => {
  if (!userOverrides.has(userId)) {
    userOverrides.set(userId, {});
  }
  userOverrides.get(userId)[featureName] = true;
  logger.info(`Feature enabled for user ${userId}: ${featureName}`);
};

/**
 * Disable feature for specific user
 * @param {string} userId - User ID
 * @param {string} featureName - Name of the feature
 */
exports.disableForUser = (userId, featureName) => {
  if (!userOverrides.has(userId)) {
    userOverrides.set(userId, {});
  }
  userOverrides.get(userId)[featureName] = false;
  logger.info(`Feature disabled for user ${userId}: ${featureName}`);
};

/**
 * Get all feature flags
 * @param {Object} context - Context (user, role, etc.)
 * @returns {Object} All feature flags
 */
exports.getAllFlags = (context = {}) => {
  let flags = { ...featureFlags };

  // Apply role overrides
  if (context.role && roleOverrides[context.role]) {
    flags = { ...flags, ...roleOverrides[context.role] };
  }

  // Apply user overrides
  if (context.userId) {
    const userFlags = userOverrides.get(context.userId);
    if (userFlags) {
      flags = { ...flags, ...userFlags };
    }
  }

  return flags;
};

/**
 * Middleware to add feature flags to request
 */
exports.featureFlagsMiddleware = (req, res, next) => {
  const context = {
    userId: req.user?.id,
    role: req.user?.role
  };

  req.features = {
    isEnabled: (featureName) => exports.isEnabled(featureName, context),
    getAllFlags: () => exports.getAllFlags(context)
  };

  next();
};

/**
 * Require feature to be enabled (middleware)
 * @param {string} featureName - Name of the feature
 * @returns {Function} Express middleware
 */
exports.requireFeature = (featureName) => {
  return (req, res, next) => {
    const context = {
      userId: req.user?.id,
      role: req.user?.role
    };

    if (!exports.isEnabled(featureName, context)) {
      return res.status(403).json({
        message: 'This feature is not available',
        code: 'FEATURE_DISABLED',
        feature: featureName
      });
    }

    next();
  };
};

/**
 * Load feature flags from environment variables
 */
exports.loadFromEnv = () => {
  const prefix = 'FEATURE_';

  Object.keys(process.env).forEach(key => {
    if (key.startsWith(prefix)) {
      const featureName = key.substring(prefix.length).toLowerCase();
      const value = process.env[key].toLowerCase() === 'true';
      featureFlags[featureName] = value;
    }
  });

  logger.info('Feature flags loaded from environment');
};

/**
 * Reset to default flags
 */
exports.reset = () => {
  featureFlags = { ...defaultFlags };
  userOverrides.clear();
  logger.info('Feature flags reset to defaults');
};

// Load from environment on startup
exports.loadFromEnv();
