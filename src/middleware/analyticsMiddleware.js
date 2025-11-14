/**
 * Analytics Middleware
 * Automatically tracks API requests and responses
 */

const analyticsService = require('../services/analytics');
const logger = require('../config/logger');

/**
 * Middleware to track API requests
 */
function trackAPIRequest(req, res, next) {
  // Store start time
  req.analyticsStartTime = Date.now();

  // Capture original end function
  const originalEnd = res.end;

  // Override end function to track response
  res.end = function(...args) {
    const duration = Date.now() - req.analyticsStartTime;
    const userId = req.user ? req.user.id : null;

    // Track API call
    analyticsService.track(userId, 'API Request', {
      method: req.method,
      path: req.path,
      route: req.route ? req.route.path : req.path,
      status_code: res.statusCode,
      duration_ms: duration,
      user_agent: req.get('user-agent'),
      ip_address: req.ip,
      platform: req.headers['x-platform'] || 'unknown'
    }).catch(err => {
      logger.error('Analytics tracking error:', err);
    });

    // Track errors (4xx, 5xx)
    if (res.statusCode >= 400) {
      analyticsService.track(userId, 'API Error', {
        method: req.method,
        path: req.path,
        status_code: res.statusCode,
        error_type: res.statusCode >= 500 ? 'server_error' : 'client_error'
      }).catch(err => {
        logger.error('Analytics error tracking error:', err);
      });
    }

    // Call original end
    return originalEnd.apply(res, args);
  };

  next();
}

/**
 * Track specific business events
 */
const trackEvent = (eventName) => {
  return async (req, res, next) => {
    try {
      const userId = req.user ? req.user.id : null;
      const properties = {
        path: req.path,
        method: req.method,
        ...req.analyticsProperties // Allow routes to set custom properties
      };

      await analyticsService.track(userId, eventName, properties);
    } catch (error) {
      logger.error(`Analytics track event error (${eventName}):`, error);
    }
    next();
  };
};

/**
 * Set analytics properties for the request
 */
function setAnalyticsProperties(properties) {
  return (req, res, next) => {
    req.analyticsProperties = {
      ...(req.analyticsProperties || {}),
      ...properties
    };
    next();
  };
}

module.exports = {
  trackAPIRequest,
  trackEvent,
  setAnalyticsProperties
};
