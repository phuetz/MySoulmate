/**
 * Cache Service with Redis
 * Provides caching functionality for improved performance
 */
const logger = require('../utils/logger');

// Redis client (will be initialized if Redis is available)
let redis = null;
let isRedisAvailable = false;

/**
 * Initialize Redis client
 */
const initializeRedis = async () => {
  try {
    // Try to require redis
    const Redis = require('ioredis');

    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0'),
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3
    };

    redis = new Redis(redisConfig);

    redis.on('connect', () => {
      isRedisAvailable = true;
      logger.info('Redis connected successfully');
    });

    redis.on('error', (err) => {
      isRedisAvailable = false;
      logger.error('Redis error:', err);
    });

    redis.on('close', () => {
      isRedisAvailable = false;
      logger.warn('Redis connection closed');
    });

    // Test connection
    await redis.ping();
    isRedisAvailable = true;
    logger.info('Redis cache service initialized');

  } catch (error) {
    logger.warn('Redis not available, using memory cache fallback:', error.message);
    redis = null;
    isRedisAvailable = false;
  }
};

// In-memory cache fallback
const memoryCache = new Map();
const memoryCacheExpiry = new Map();

/**
 * Get value from cache
 * @param {string} key - Cache key
 * @returns {Promise<any>} Cached value or null
 */
exports.get = async (key) => {
  try {
    if (isRedisAvailable && redis) {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    }

    // Fallback to memory cache
    const expiry = memoryCacheExpiry.get(key);
    if (expiry && expiry < Date.now()) {
      memoryCache.delete(key);
      memoryCacheExpiry.delete(key);
      return null;
    }
    return memoryCache.get(key) || null;
  } catch (error) {
    logger.error('Cache get error:', error);
    return null;
  }
};

/**
 * Set value in cache
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in seconds (default: 3600)
 * @returns {Promise<boolean>} Success
 */
exports.set = async (key, value, ttl = 3600) => {
  try {
    if (isRedisAvailable && redis) {
      await redis.setex(key, ttl, JSON.stringify(value));
      return true;
    }

    // Fallback to memory cache
    memoryCache.set(key, value);
    memoryCacheExpiry.set(key, Date.now() + ttl * 1000);
    return true;
  } catch (error) {
    logger.error('Cache set error:', error);
    return false;
  }
};

/**
 * Delete value from cache
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} Success
 */
exports.del = async (key) => {
  try {
    if (isRedisAvailable && redis) {
      await redis.del(key);
      return true;
    }

    // Fallback to memory cache
    memoryCache.delete(key);
    memoryCacheExpiry.delete(key);
    return true;
  } catch (error) {
    logger.error('Cache delete error:', error);
    return false;
  }
};

/**
 * Delete multiple keys matching pattern
 * @param {string} pattern - Key pattern (e.g., "user:*")
 * @returns {Promise<number>} Number of keys deleted
 */
exports.delPattern = async (pattern) => {
  try {
    if (isRedisAvailable && redis) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      return keys.length;
    }

    // Fallback to memory cache
    let count = 0;
    const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
    for (const key of memoryCache.keys()) {
      if (regex.test(key)) {
        memoryCache.delete(key);
        memoryCacheExpiry.delete(key);
        count++;
      }
    }
    return count;
  } catch (error) {
    logger.error('Cache delete pattern error:', error);
    return 0;
  }
};

/**
 * Check if key exists
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} Exists
 */
exports.exists = async (key) => {
  try {
    if (isRedisAvailable && redis) {
      const result = await redis.exists(key);
      return result === 1;
    }

    // Fallback to memory cache
    const expiry = memoryCacheExpiry.get(key);
    if (expiry && expiry < Date.now()) {
      memoryCache.delete(key);
      memoryCacheExpiry.delete(key);
      return false;
    }
    return memoryCache.has(key);
  } catch (error) {
    logger.error('Cache exists error:', error);
    return false;
  }
};

/**
 * Set expiration time for key
 * @param {string} key - Cache key
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<boolean>} Success
 */
exports.expire = async (key, ttl) => {
  try {
    if (isRedisAvailable && redis) {
      await redis.expire(key, ttl);
      return true;
    }

    // Fallback to memory cache
    if (memoryCache.has(key)) {
      memoryCacheExpiry.set(key, Date.now() + ttl * 1000);
      return true;
    }
    return false;
  } catch (error) {
    logger.error('Cache expire error:', error);
    return false;
  }
};

/**
 * Increment value
 * @param {string} key - Cache key
 * @param {number} increment - Amount to increment (default: 1)
 * @returns {Promise<number>} New value
 */
exports.incr = async (key, increment = 1) => {
  try {
    if (isRedisAvailable && redis) {
      return await redis.incrby(key, increment);
    }

    // Fallback to memory cache
    const current = memoryCache.get(key) || 0;
    const newValue = current + increment;
    memoryCache.set(key, newValue);
    return newValue;
  } catch (error) {
    logger.error('Cache increment error:', error);
    return 0;
  }
};

/**
 * Cache middleware for Express routes
 * @param {number} ttl - Time to live in seconds
 * @param {Function} keyGenerator - Function to generate cache key from request
 * @returns {Function} Express middleware
 */
exports.cacheMiddleware = (ttl = 300, keyGenerator = null) => {
  return async (req, res, next) => {
    // Generate cache key
    const cacheKey = keyGenerator
      ? keyGenerator(req)
      : `cache:${req.method}:${req.originalUrl}`;

    try {
      // Try to get from cache
      const cached = await exports.get(cacheKey);

      if (cached) {
        logger.debug(`Cache hit: ${cacheKey}`);
        return res.json(cached);
      }

      // Cache miss - continue to route handler
      logger.debug(`Cache miss: ${cacheKey}`);

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache response
      res.json = function(data) {
        // Cache the response
        exports.set(cacheKey, data, ttl).catch(err => {
          logger.error('Failed to cache response:', err);
        });

        // Send response
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
};

/**
 * Clear all cache
 * @returns {Promise<boolean>} Success
 */
exports.clear = async () => {
  try {
    if (isRedisAvailable && redis) {
      await redis.flushdb();
      return true;
    }

    // Fallback to memory cache
    memoryCache.clear();
    memoryCacheExpiry.clear();
    return true;
  } catch (error) {
    logger.error('Cache clear error:', error);
    return false;
  }
};

/**
 * Get cache statistics
 * @returns {Promise<Object>} Stats
 */
exports.stats = async () => {
  try {
    if (isRedisAvailable && redis) {
      const info = await redis.info('stats');
      const dbSize = await redis.dbsize();
      return {
        type: 'redis',
        available: true,
        keys: dbSize,
        info
      };
    }

    // Memory cache stats
    return {
      type: 'memory',
      available: true,
      keys: memoryCache.size,
      memoryUsage: process.memoryUsage().heapUsed
    };
  } catch (error) {
    logger.error('Cache stats error:', error);
    return {
      type: 'unknown',
      available: false,
      error: error.message
    };
  }
};

/**
 * Close Redis connection
 */
exports.close = async () => {
  if (redis) {
    await redis.quit();
    logger.info('Redis connection closed');
  }
};

/**
 * Check if Redis is available
 * @returns {boolean}
 */
exports.isRedisAvailable = () => isRedisAvailable;

// Initialize Redis on module load
initializeRedis().catch(err => {
  logger.warn('Failed to initialize Redis:', err.message);
});

// Clean up memory cache periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, expiry] of memoryCacheExpiry.entries()) {
    if (expiry < now) {
      memoryCache.delete(key);
      memoryCacheExpiry.delete(key);
    }
  }
}, 60000); // Every minute
