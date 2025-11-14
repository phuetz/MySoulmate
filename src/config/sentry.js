/**
 * Sentry Configuration
 * Centralized error tracking configuration
 */

const errorTrackingService = require('../services/errorTracking');

/**
 * Initialize Sentry with Express app
 */
function initializeSentry(app) {
  // Initialize the error tracking service
  errorTrackingService.initialize();

  // Add request handler (must be first middleware)
  app.use(errorTrackingService.expressRequestHandler());

  // Add tracing handler (for performance monitoring)
  app.use(errorTrackingService.expressTracingHandler());

  return errorTrackingService;
}

/**
 * Add Sentry error handler (must be after all routes, before other error handlers)
 */
function addSentryErrorHandler(app) {
  app.use(errorTrackingService.expressErrorHandler());
}

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown() {
  await errorTrackingService.flush();
}

module.exports = {
  initializeSentry,
  addSentryErrorHandler,
  gracefulShutdown,
  errorTrackingService
};
