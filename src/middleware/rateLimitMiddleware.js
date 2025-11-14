/**
 * Rate Limiting Middleware (Per User)
 * Provides advanced rate limiting capabilities per user
 */
const cacheService = require('../services/cacheService');
const logger = require('../utils/logger');
const auditLogger = require('../utils/auditLogger');

/**
 * Create rate limiter for specific user
 * @param {Object} options - Rate limit options
 * @returns {Function} Express middleware
 */
exports.userRateLimit = (options = {}) => {
  const {
    windowMs = 60000, // 1 minute
    max = 60, // 60 requests per minute
    keyPrefix = 'ratelimit',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    handler = defaultHandler,
    skip = () => false,
    onLimitReached = null
  } = options;

  return async (req, res, next) => {
    try {
      // Skip if specified
      if (skip(req)) {
        return next();
      }

      // Get user ID
      const userId = req.user?.id;
      if (!userId) {
        // No user, apply IP-based rate limiting
        return next();
      }

      // Create rate limit key
      const key = `${keyPrefix}:user:${userId}`;

      // Get current count
      const current = await cacheService.get(key);
      const count = current ? parseInt(current) : 0;

      // Check if limit exceeded
      if (count >= max) {
        // Log rate limit exceeded
        logger.warn(`Rate limit exceeded for user ${userId}`, {
          endpoint: req.path,
          count,
          max
        });

        // Audit log
        await auditLogger.log({
          action: auditLogger.ACTIONS.RATE_LIMIT_EXCEEDED,
          userId,
          ipAddress: req.ip,
          status: 'failure',
          details: {
            endpoint: req.path,
            count,
            max
          }
        });

        // Call custom handler
        if (onLimitReached) {
          await onLimitReached(req, res);
        }

        return handler(req, res);
      }

      // Increment counter
      const newCount = count + 1;
      await cacheService.set(key, newCount, Math.ceil(windowMs / 1000));

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, max - newCount));
      res.setHeader('X-RateLimit-Reset', Date.now() + windowMs);

      // Store original methods
      const originalJson = res.json.bind(res);
      const originalSend = res.send.bind(res);

      // Decrement on successful/failed requests based on options
      const shouldDecrement = () => {
        if (skipSuccessfulRequests && res.statusCode < 400) return true;
        if (skipFailedRequests && res.statusCode >= 400) return true;
        return false;
      };

      // Override response methods to handle decrements
      res.json = function(data) {
        if (shouldDecrement()) {
          cacheService.incr(key, -1).catch(err => {
            logger.error('Failed to decrement rate limit:', err);
          });
        }
        return originalJson(data);
      };

      res.send = function(data) {
        if (shouldDecrement()) {
          cacheService.incr(key, -1).catch(err => {
            logger.error('Failed to decrement rate limit:', err);
          });
        }
        return originalSend(data);
      };

      next();
    } catch (error) {
      logger.error('Rate limit middleware error:', error);
      // Don't block request on error
      next();
    }
  };
};

/**
 * Default rate limit exceeded handler
 */
const defaultHandler = (req, res) => {
  res.status(429).json({
    message: 'Too many requests, please try again later',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: 60 // seconds
  });
};

/**
 * Tier-based rate limiting
 * Different limits for different user tiers
 */
exports.tieredRateLimit = (tiers) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role || 'user';
      const isPremium = req.user?.isPremium || false;

      // Determine tier
      let tier = 'free';
      if (userRole === 'admin') {
        tier = 'admin';
      } else if (isPremium) {
        tier = 'premium';
      }

      // Get tier configuration
      const config = tiers[tier] || tiers.free;

      // Apply rate limit with tier config
      const rateLimiter = exports.userRateLimit(config);
      return rateLimiter(req, res, next);
    } catch (error) {
      logger.error('Tiered rate limit error:', error);
      next();
    }
  };
};

/**
 * Rate limit by action type
 * Different limits for different actions
 */
exports.actionRateLimit = (action, options = {}) => {
  const keyPrefix = `ratelimit:action:${action}`;
  return exports.userRateLimit({ ...options, keyPrefix });
};

/**
 * Endpoint-specific rate limits
 */
exports.endpointLimits = {
  // Authentication endpoints
  login: exports.userRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    keyPrefix: 'ratelimit:login',
    handler: (req, res) => {
      res.status(429).json({
        message: 'Too many login attempts, please try again later',
        code: 'LOGIN_RATE_LIMIT_EXCEEDED',
        retryAfter: 900 // 15 minutes in seconds
      });
    }
  }),

  register: exports.userRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    keyPrefix: 'ratelimit:register'
  }),

  passwordReset: exports.userRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    keyPrefix: 'ratelimit:password-reset'
  }),

  // AI endpoints
  aiChat: exports.tieredRateLimit({
    free: {
      windowMs: 60 * 1000, // 1 minute
      max: 10
    },
    premium: {
      windowMs: 60 * 1000,
      max: 60
    },
    admin: {
      windowMs: 60 * 1000,
      max: 120
    }
  }),

  // Payment endpoints
  payment: exports.userRateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10,
    keyPrefix: 'ratelimit:payment'
  }),

  // File upload
  upload: exports.userRateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5,
    keyPrefix: 'ratelimit:upload'
  }),

  // API general
  api: exports.userRateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60,
    keyPrefix: 'ratelimit:api'
  })
};

/**
 * Get rate limit status for user
 * @param {string} userId - User ID
 * @param {string} action - Action type (optional)
 * @returns {Promise<Object>} Rate limit status
 */
exports.getRateLimitStatus = async (userId, action = 'api') => {
  try {
    const key = `ratelimit:${action}:user:${userId}`;
    const count = await cacheService.get(key);

    return {
      userId,
      action,
      current: count || 0,
      remaining: Math.max(0, 60 - (count || 0)),
      resetAt: Date.now() + 60000
    };
  } catch (error) {
    logger.error('Error getting rate limit status:', error);
    return null;
  }
};

/**
 * Reset rate limit for user
 * @param {string} userId - User ID
 * @param {string} action - Action type (optional)
 * @returns {Promise<boolean>} Success
 */
exports.resetRateLimit = async (userId, action = '*') => {
  try {
    if (action === '*') {
      // Reset all rate limits for user
      const deleted = await cacheService.delPattern(`ratelimit:*:user:${userId}`);
      logger.info(`Reset all rate limits for user ${userId} (${deleted} keys)`);
      return true;
    } else {
      // Reset specific action
      const key = `ratelimit:${action}:user:${userId}`;
      await cacheService.del(key);
      logger.info(`Reset rate limit for user ${userId}, action: ${action}`);
      return true;
    }
  } catch (error) {
    logger.error('Error resetting rate limit:', error);
    return false;
  }
};

module.exports = exports;
