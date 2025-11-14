/**
 * Health Check Routes
 *
 * Provides endpoints for monitoring application health and readiness
 */

const express = require('express');
const router = express.Router();
const { testConnection } = require('../models');
const logger = require('../utils/logger');
const os = require('os');

/**
 * Basic health check
 * Returns 200 if application is running
 *
 * @route GET /health
 * @access Public
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

/**
 * Detailed health check with dependencies
 * Checks database, external APIs, etc.
 *
 * @route GET /health/detailed
 * @access Public (should be restricted in production)
 */
router.get('/health/detailed', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
    checks: {}
  };

  // Check database
  try {
    const dbConnected = await testConnection();
    health.checks.database = {
      status: dbConnected ? 'ok' : 'error',
      message: dbConnected ? 'Database connection successful' : 'Database connection failed'
    };
  } catch (error) {
    health.checks.database = {
      status: 'error',
      message: error.message
    };
    health.status = 'degraded';
  }

  // Check memory usage
  const memoryUsage = process.memoryUsage();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const memoryUsagePercent = ((totalMemory - freeMemory) / totalMemory) * 100;

  health.checks.memory = {
    status: memoryUsagePercent < 90 ? 'ok' : 'warning',
    heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
    heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
    systemUsage: `${memoryUsagePercent.toFixed(2)}%`
  };

  // Check CPU
  const cpuUsage = process.cpuUsage();
  health.checks.cpu = {
    status: 'ok',
    user: cpuUsage.user,
    system: cpuUsage.system,
    cores: os.cpus().length
  };

  // Check environment variables
  const requiredEnvVars = ['JWT_SECRET', 'PAYMENT_SECRET'];
  const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);

  health.checks.environment = {
    status: missingEnvVars.length === 0 ? 'ok' : 'error',
    missing: missingEnvVars,
    message: missingEnvVars.length === 0
      ? 'All required environment variables are set'
      : `Missing: ${missingEnvVars.join(', ')}`
  };

  if (missingEnvVars.length > 0) {
    health.status = 'error';
  }

  // Overall status
  const statusCode = health.status === 'ok' ? 200 : health.status === 'degraded' ? 503 : 500;

  res.status(statusCode).json(health);
});

/**
 * Readiness check
 * Returns 200 when application is ready to accept traffic
 *
 * @route GET /health/ready
 * @access Public
 */
router.get('/health/ready', async (req, res) => {
  try {
    // Check if database is ready
    const dbReady = await testConnection();

    if (!dbReady) {
      return res.status(503).json({
        status: 'not_ready',
        message: 'Database not ready'
      });
    }

    // Check if all critical services are initialized
    // Add more checks as needed

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({
      status: 'not_ready',
      message: error.message
    });
  }
});

/**
 * Liveness check
 * Returns 200 if application is alive (not deadlocked)
 *
 * @route GET /health/live
 * @access Public
 */
router.get('/health/live', (req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
