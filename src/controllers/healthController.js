/**
 * Health check controller
 * Provides endpoints for monitoring service health and readiness
 */
const { testConnection } = require('../models');
const logger = require('../utils/logger');
const os = require('os');

/**
 * @desc    Basic health check - Always returns 200 if server is running
 * @route   GET /health
 * @access  Public
 */
exports.healthCheck = async (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'MySoulmate API'
  });
};

/**
 * @desc    Detailed health check with database and dependencies
 * @route   GET /health/detailed
 * @access  Public
 */
exports.detailedHealthCheck = async (req, res) => {
  const checks = {
    server: 'healthy',
    database: 'unknown',
    memory: 'healthy',
    openai: 'unknown'
  };

  let overallStatus = 'healthy';

  // Check database connection
  try {
    const dbConnected = await testConnection();
    checks.database = dbConnected ? 'healthy' : 'unhealthy';
    if (!dbConnected) overallStatus = 'degraded';
  } catch (error) {
    checks.database = 'unhealthy';
    overallStatus = 'degraded';
    logger.error('Health check - Database error:', error);
  }

  // Check memory usage
  const memoryUsage = process.memoryUsage();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const memoryUsagePercent = ((totalMemory - freeMemory) / totalMemory) * 100;

  if (memoryUsagePercent > 90) {
    checks.memory = 'critical';
    overallStatus = 'degraded';
  } else if (memoryUsagePercent > 80) {
    checks.memory = 'warning';
  }

  // Check OpenAI API availability (basic check)
  if (process.env.OPENAI_API_KEY) {
    checks.openai = 'configured';
  } else {
    checks.openai = 'not_configured';
  }

  const httpStatus = overallStatus === 'healthy' ? 200 : 503;

  res.status(httpStatus).json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    checks,
    system: {
      uptime: process.uptime(),
      memory: {
        total: totalMemory,
        free: freeMemory,
        used: totalMemory - freeMemory,
        usagePercent: memoryUsagePercent.toFixed(2)
      },
      process: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        rss: memoryUsage.rss
      },
      cpu: {
        cores: os.cpus().length,
        loadAverage: os.loadavg()
      }
    }
  });
};

/**
 * @desc    Readiness check - Indicates if service is ready to accept traffic
 * @route   GET /health/ready
 * @access  Public
 */
exports.readinessCheck = async (req, res) => {
  try {
    // Check if database is ready
    const dbReady = await testConnection();

    // Check if critical environment variables are set
    const requiredEnvVars = ['JWT_SECRET'];
    const envVarsReady = requiredEnvVars.every(varName => !!process.env[varName]);

    const isReady = dbReady && envVarsReady;

    if (isReady) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        reasons: {
          database: dbReady ? 'ready' : 'not_ready',
          environment: envVarsReady ? 'ready' : 'missing_vars'
        }
      });
    }
  } catch (error) {
    logger.error('Readiness check error:', error);
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
};

/**
 * @desc    Liveness check - Indicates if service should be restarted
 * @route   GET /health/live
 * @access  Public
 */
exports.livenessCheck = async (req, res) => {
  // Simple check - if we can respond, we're alive
  // This is useful for Kubernetes liveness probes
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
};

/**
 * @desc    Get service version and build info
 * @route   GET /health/version
 * @access  Public
 */
exports.versionInfo = async (req, res) => {
  const packageJson = require('../../package.json');

  res.status(200).json({
    service: packageJson.name || 'MySoulmate API',
    version: packageJson.version || '1.0.0',
    description: packageJson.description || '',
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
};
