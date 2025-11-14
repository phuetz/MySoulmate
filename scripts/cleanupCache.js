#!/usr/bin/env node

/**
 * Cache Cleanup Script
 *
 * Clears all cached data from Redis
 */

require('dotenv').config();
const cache = require('../src/utils/cache');
const logger = require('../src/utils/logger');

async function cleanupCache() {
  logger.info('Starting cache cleanup...');

  try {
    await cache.flush();
    logger.info('✅ Cache cleared successfully');

    console.log('');
    console.log('Cache cleanup completed!');
    console.log('');

    process.exit(0);
  } catch (error) {
    logger.error('Cache cleanup failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  cleanupCache();
}

module.exports = cleanupCache;
