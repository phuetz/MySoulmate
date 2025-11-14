/**
 * Routes pour les health checks
 */
const express = require('express');
const router = express.Router();
const {
  healthCheck,
  detailedHealthCheck,
  readinessCheck,
  livenessCheck,
  versionInfo
} = require('../controllers/healthController');

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Basic health check
 *     description: Returns OK if the service is running
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 */
router.get('/', healthCheck);

/**
 * @swagger
 * /health/detailed:
 *   get:
 *     summary: Detailed health check
 *     description: Returns detailed health information including database, memory, and dependencies
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is fully healthy
 *       503:
 *         description: Service is degraded
 */
router.get('/detailed', detailedHealthCheck);

/**
 * @swagger
 * /health/ready:
 *   get:
 *     summary: Readiness check
 *     description: Indicates if the service is ready to accept traffic
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is ready
 *       503:
 *         description: Service is not ready
 */
router.get('/ready', readinessCheck);

/**
 * @swagger
 * /health/live:
 *   get:
 *     summary: Liveness check
 *     description: Indicates if the service is alive (useful for Kubernetes probes)
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is alive
 */
router.get('/live', livenessCheck);

/**
 * @swagger
 * /health/version:
 *   get:
 *     summary: Version information
 *     description: Returns service version and build information
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Version information
 */
router.get('/version', versionInfo);

module.exports = router;
