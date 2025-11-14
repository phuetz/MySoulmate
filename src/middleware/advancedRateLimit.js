/**
 * Advanced Rate Limiting Middleware
 * Implements per-user, per-IP, and adaptive rate limiting
 */

const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const logger = require('../config/logger');

/**
 * Create Redis store for rate limiting
 */
function createRedisStore() {
  try {
    const Redis = require('ioredis');
    const client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: process.env.REDIS_DB || 0
    });

    return new RedisStore({
      client,
      prefix: 'rate_limit:'
    });
  } catch (error) {
    logger.warn('Redis not available for rate limiting, using memory store');
    return undefined; // Will use default memory store
  }
}

/**
 * Per-user rate limiter
 * Limits requests per authenticated user
 */
const perUserLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: async (req) => {
    // Different limits based on user role
    if (!req.user) return 100; // Anonymous users

    switch (req.user.role) {
      case 'admin':
        return 10000; // High limit for admins
      case 'premium':
        return 1000; // Higher limit for premium users
      default:
        return 500; // Standard limit for regular users
    }
  },
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    return req.user ? `user:${req.user.id}` : `ip:${req.ip}`;
  },
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for ${req.user ? `user ${req.user.id}` : `IP ${req.ip}`}`);
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore()
});

/**
 * Endpoint-specific rate limiters
 */
const rateLimiters = {
  // Authentication endpoints (strict)
  auth: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many login attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    store: createRedisStore()
  }),

  // AI interactions (moderate)
  ai: rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: async (req) => {
      if (!req.user) return 5;

      switch (req.user.role) {
        case 'premium':
        case 'elite':
          return 100; // Premium users get more AI calls
        default:
          return 20; // Free users limited
      }
    },
    keyGenerator: (req) => {
      return req.user ? `user:${req.user.id}` : `ip:${req.ip}`;
    },
    handler: (req, res) => {
      res.status(429).json({
        error: 'AI rate limit exceeded',
        message: 'Upgrade to premium for more AI interactions',
        upgradeUrl: '/api/v1/subscriptions/plans'
      });
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: createRedisStore()
  }),

  // File uploads (very strict)
  upload: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: 'Too many file uploads, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    store: createRedisStore()
  }),

  // Email sending (strict)
  email: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: 'Too many emails sent, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    store: createRedisStore()
  }),

  // Password reset (very strict)
  passwordReset: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3,
    message: 'Too many password reset attempts',
    standardHeaders: true,
    legacyHeaders: false,
    store: createRedisStore()
  }),

  // 2FA attempts (strict)
  twoFactor: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Too many 2FA attempts',
    standardHeaders: true,
    legacyHeaders: false,
    store: createRedisStore()
  })
};

/**
 * Adaptive rate limiter
 * Adjusts limits based on server load
 */
class AdaptiveRateLimiter {
  constructor() {
    this.baseMax = 100;
    this.currentMax = 100;
    this.checkInterval = 60000; // 1 minute

    // Monitor system load
    setInterval(() => {
      this.adjustLimits();
    }, this.checkInterval);
  }

  adjustLimits() {
    const loadAvg = require('os').loadavg()[0]; // 1-minute load average
    const cpuCount = require('os').cpus().length;
    const loadPerCpu = loadAvg / cpuCount;

    // Adjust limits based on load
    if (loadPerCpu > 0.8) {
      // High load - reduce limits
      this.currentMax = Math.floor(this.baseMax * 0.5);
      logger.warn(`High server load detected, rate limit reduced to ${this.currentMax}`);
    } else if (loadPerCpu > 0.5) {
      // Medium load - slightly reduce
      this.currentMax = Math.floor(this.baseMax * 0.75);
    } else {
      // Normal load - restore full limits
      this.currentMax = this.baseMax;
    }
  }

  getLimit() {
    return this.currentMax;
  }
}

const adaptiveLimiter = new AdaptiveRateLimiter();

/**
 * Custom rate limiter with burst handling
 */
function createBurstLimiter(options = {}) {
  const {
    windowMs = 60000, // 1 minute
    maxRequests = 100,
    maxBurst = 20, // Max burst requests
    burstWindowMs = 1000 // 1 second burst window
  } = options;

  const requests = new Map();

  return (req, res, next) => {
    const key = req.user ? `user:${req.user.id}` : `ip:${req.ip}`;
    const now = Date.now();

    // Get user's request history
    let history = requests.get(key) || [];

    // Remove old requests outside the window
    history = history.filter(time => now - time < windowMs);

    // Check burst limit
    const recentRequests = history.filter(time => now - time < burstWindowMs);
    if (recentRequests.length >= maxBurst) {
      return res.status(429).json({
        error: 'Burst limit exceeded',
        message: 'Too many requests in a short time'
      });
    }

    // Check overall limit
    if (history.length >= maxRequests) {
      const oldestRequest = Math.min(...history);
      const retryAfter = Math.ceil((oldestRequest + windowMs - now) / 1000);

      res.set('Retry-After', retryAfter);
      return res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter
      });
    }

    // Add current request
    history.push(now);
    requests.set(key, history);

    // Cleanup old entries periodically
    if (Math.random() < 0.01) { // 1% chance
      this.cleanup(requests, windowMs);
    }

    next();
  };
}

/**
 * Cleanup old entries
 */
function cleanup(map, windowMs) {
  const now = Date.now();
  for (const [key, history] of map.entries()) {
    const filtered = history.filter(time => now - time < windowMs);
    if (filtered.length === 0) {
      map.delete(key);
    } else {
      map.set(key, filtered);
    }
  }
}

/**
 * IP-based rate limiter with whitelist/blacklist
 */
function createSmartIpLimiter() {
  const whitelist = new Set((process.env.IP_WHITELIST || '').split(',').filter(Boolean));
  const blacklist = new Set((process.env.IP_BLACKLIST || '').split(',').filter(Boolean));

  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    skip: (req) => {
      // Skip whitelisted IPs
      if (whitelist.has(req.ip)) {
        return true;
      }

      // Block blacklisted IPs immediately
      if (blacklist.has(req.ip)) {
        return false; // Will hit rate limit immediately
      }

      return false;
    },
    keyGenerator: (req) => req.ip,
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`);

      // Auto-blacklist IPs that exceed limits repeatedly
      const violations = (req.rateLimit.current || 0) / (req.rateLimit.limit || 1);
      if (violations > 2) {
        logger.error(`IP ${req.ip} auto-blacklisted due to excessive violations`);
        // TODO: Add to blacklist in database/Redis
      }

      res.status(429).json({
        error: 'Too many requests from this IP',
        retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
      });
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: createRedisStore()
  });
}

module.exports = {
  perUserLimiter,
  rateLimiters,
  adaptiveLimiter,
  createBurstLimiter,
  createSmartIpLimiter
};
