/**
 * Enhanced Request Logging Middleware
 *
 * Logs detailed request/response information for monitoring and debugging
 */

const logger = require('../utils/logger');

/**
 * Request logger middleware
 * Logs request details and response time
 */
function requestLogger(req, res, next) {
  const startTime = Date.now();

  // Log request
  const requestLog = {
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip,
    userAgent: req.headers['user-agent'],
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  };

  // Capture response
  const originalSend = res.send;
  res.send = function (data) {
    res.send = originalSend;

    const duration = Date.now() - startTime;
    const responseLog = {
      ...requestLog,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length') || 0
    };

    // Log based on status code
    if (res.statusCode >= 500) {
      logger.error('Request completed with error', responseLog);
    } else if (res.statusCode >= 400) {
      logger.warn('Request completed with client error', responseLog);
    } else {
      logger.info('Request completed', responseLog);
    }

    return res.send(data);
  };

  next();
}

/**
 * Slow request logger
 * Logs requests that take longer than threshold
 */
function slowRequestLogger(thresholdMs = 1000) {
  return (req, res, next) => {
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;

      if (duration > thresholdMs) {
        logger.warn('Slow request detected', {
          method: req.method,
          url: req.originalUrl || req.url,
          duration: `${duration}ms`,
          threshold: `${thresholdMs}ms`,
          userId: req.user?.id
        });
      }
    });

    next();
  };
}

/**
 * Error request logger
 * Logs requests that result in errors
 */
function errorRequestLogger(err, req, res, next) {
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip,
    userId: req.user?.id,
    body: req.body,
    params: req.params,
    query: req.query
  });

  next(err);
}

module.exports = {
  requestLogger,
  slowRequestLogger,
  errorRequestLogger
};
