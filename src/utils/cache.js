/**
 * Cache Utility
 *
 * Supports both Redis (production) and in-memory (development) caching
 */

const logger = require('./logger');
const { CACHE } = require('../config/constants');

// Cache backend
let cacheBackend;
let isRedisAvailable = false;

/**
 * Initialize cache backend
 */
function initializeCache() {
  // Try to use Redis if available
  if (process.env.REDIS_HOST) {
    try {
      const Redis = require('ioredis');
      cacheBackend = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        maxRetriesPerRequest: 3
      });

      cacheBackend.on('connect', () => {
        logger.info('Redis cache connected');
        isRedisAvailable = true;
      });

      cacheBackend.on('error', (err) => {
        logger.error('Redis error:', err);
        isRedisAvailable = false;
      });

    } catch (error) {
      logger.warn('Redis not available, using in-memory cache:', error.message);
      cacheBackend = new InMemoryCache();
    }
  } else {
    logger.info('Using in-memory cache (Redis not configured)');
    cacheBackend = new InMemoryCache();
  }
}

/**
 * In-memory cache implementation (fallback)
 */
class InMemoryCache {
  constructor() {
    this.cache = new Map();
    this.expirations = new Map();
  }

  async get(key) {
    // Check expiration
    const expiration = this.expirations.get(key);
    if (expiration && Date.now() > expiration) {
      this.cache.delete(key);
      this.expirations.delete(key);
      return null;
    }

    return this.cache.get(key) || null;
  }

  async set(key, value, ttl = 3600) {
    this.cache.set(key, value);

    if (ttl > 0) {
      this.expirations.set(key, Date.now() + (ttl * 1000));
    }

    return 'OK';
  }

  async del(key) {
    this.cache.delete(key);
    this.expirations.delete(key);
    return 1;
  }

  async exists(key) {
    return this.cache.has(key) ? 1 : 0;
  }

  async expire(key, seconds) {
    if (this.cache.has(key)) {
      this.expirations.set(key, Date.now() + (seconds * 1000));
      return 1;
    }
    return 0;
  }

  async ttl(key) {
    const expiration = this.expirations.get(key);
    if (!expiration) {
      return -1;
    }
    const remaining = Math.floor((expiration - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  async flushdb() {
    this.cache.clear();
    this.expirations.clear();
    return 'OK';
  }
}

/**
 * Get cached value
 * @param {string} key - Cache key
 * @returns {Promise<any>} Cached value or null
 */
async function get(key) {
  try {
    const value = await cacheBackend.get(key);

    if (value === null || value === undefined) {
      return null;
    }

    // Try to parse JSON
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  } catch (error) {
    logger.error('Cache get error:', error);
    return null;
  }
}

/**
 * Set cached value
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<boolean>} Success
 */
async function set(key, value, ttl = CACHE.USER_DATA_TTL) {
  try {
    const stringValue = typeof value === 'string'
      ? value
      : JSON.stringify(value);

    await cacheBackend.set(key, stringValue, ttl);
    return true;
  } catch (error) {
    logger.error('Cache set error:', error);
    return false;
  }
}

/**
 * Delete cached value
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} Success
 */
async function del(key) {
  try {
    await cacheBackend.del(key);
    return true;
  } catch (error) {
    logger.error('Cache delete error:', error);
    return false;
  }
}

/**
 * Check if key exists
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} Exists
 */
async function exists(key) {
  try {
    const result = await cacheBackend.exists(key);
    return result === 1;
  } catch (error) {
    logger.error('Cache exists error:', error);
    return false;
  }
}

/**
 * Get or set cached value
 * @param {string} key - Cache key
 * @param {Function} fetchFn - Function to fetch value if not cached
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<any>} Cached or fetched value
 */
async function getOrSet(key, fetchFn, ttl = CACHE.USER_DATA_TTL) {
  try {
    // Try to get from cache
    const cached = await get(key);
    if (cached !== null) {
      return cached;
    }

    // Fetch fresh data
    const value = await fetchFn();

    // Cache it
    await set(key, value, ttl);

    return value;
  } catch (error) {
    logger.error('Cache getOrSet error:', error);
    // If caching fails, still return the fetched value
    try {
      return await fetchFn();
    } catch (fetchError) {
      throw fetchError;
    }
  }
}

/**
 * Clear all cache
 * @returns {Promise<boolean>} Success
 */
async function flush() {
  try {
    await cacheBackend.flushdb();
    logger.info('Cache flushed');
    return true;
  } catch (error) {
    logger.error('Cache flush error:', error);
    return false;
  }
}

// Initialize on module load
initializeCache();

module.exports = {
  get,
  set,
  del,
  exists,
  getOrSet,
  flush,
  isRedisAvailable: () => isRedisAvailable
};
