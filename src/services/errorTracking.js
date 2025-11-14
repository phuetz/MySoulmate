/**
 * Error Tracking Service
 * Integrates with Sentry and provides error monitoring
 */

const logger = require('../config/logger');

class ErrorTrackingService {
  constructor() {
    this.sentry = null;
    this.isInitialized = false;
    this.environment = process.env.NODE_ENV || 'development';
  }

  /**
   * Initialize error tracking (Sentry)
   */
  initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      // Only initialize if DSN is provided
      if (process.env.SENTRY_DSN) {
        const Sentry = require('@sentry/node');
        const { ProfilingIntegration } = require('@sentry/profiling-node');

        Sentry.init({
          dsn: process.env.SENTRY_DSN,
          environment: this.environment,
          release: process.env.APP_VERSION || 'unknown',

          // Performance Monitoring
          tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),

          // Profiling
          profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'),
          integrations: [
            new ProfilingIntegration(),
          ],

          // Filter out sensitive data
          beforeSend(event, hint) {
            // Remove sensitive headers
            if (event.request?.headers) {
              delete event.request.headers.authorization;
              delete event.request.headers.cookie;
              delete event.request.headers['x-api-key'];
            }

            // Remove sensitive data from context
            if (event.contexts?.user) {
              delete event.contexts.user.email;
              delete event.contexts.user.ip_address;
            }

            return event;
          },

          // Ignore certain errors
          ignoreErrors: [
            'Network request failed',
            'ECONNREFUSED',
            'ETIMEDOUT',
            'ENOTFOUND',
            // Add more patterns to ignore
          ],

          // Custom tags
          initialScope: {
            tags: {
              app_version: process.env.APP_VERSION || 'unknown',
              node_version: process.version
            }
          }
        });

        this.sentry = Sentry;
        this.isInitialized = true;

        logger.info('Sentry error tracking initialized');
      } else {
        logger.info('Sentry DSN not configured, error tracking disabled');
      }
    } catch (error) {
      logger.error('Failed to initialize Sentry:', error);
    }
  }

  /**
   * Capture an exception
   */
  captureException(error, context = {}) {
    try {
      if (this.sentry) {
        this.sentry.captureException(error, {
          tags: context.tags,
          extra: context.extra,
          user: context.user ? {
            id: context.user.id,
            username: context.user.username
          } : undefined,
          level: context.level || 'error'
        });
      }

      // Also log to Winston
      logger.error('Exception captured:', {
        error: error.message,
        stack: error.stack,
        context
      });
    } catch (err) {
      logger.error('Failed to capture exception:', err);
    }
  }

  /**
   * Capture a message
   */
  captureMessage(message, level = 'info', context = {}) {
    try {
      if (this.sentry) {
        this.sentry.captureMessage(message, {
          level,
          tags: context.tags,
          extra: context.extra,
          user: context.user ? {
            id: context.user.id,
            username: context.user.username
          } : undefined
        });
      }

      logger.log(level, message, context);
    } catch (error) {
      logger.error('Failed to capture message:', error);
    }
  }

  /**
   * Set user context
   */
  setUser(user) {
    try {
      if (this.sentry) {
        this.sentry.setUser({
          id: user.id,
          username: user.username || user.email,
          // Don't send sensitive data
        });
      }
    } catch (error) {
      logger.error('Failed to set user context:', error);
    }
  }

  /**
   * Clear user context
   */
  clearUser() {
    try {
      if (this.sentry) {
        this.sentry.setUser(null);
      }
    } catch (error) {
      logger.error('Failed to clear user context:', error);
    }
  }

  /**
   * Set custom tag
   */
  setTag(key, value) {
    try {
      if (this.sentry) {
        this.sentry.setTag(key, value);
      }
    } catch (error) {
      logger.error('Failed to set tag:', error);
    }
  }

  /**
   * Set custom context
   */
  setContext(name, context) {
    try {
      if (this.sentry) {
        this.sentry.setContext(name, context);
      }
    } catch (error) {
      logger.error('Failed to set context:', error);
    }
  }

  /**
   * Add breadcrumb
   */
  addBreadcrumb(breadcrumb) {
    try {
      if (this.sentry) {
        this.sentry.addBreadcrumb({
          message: breadcrumb.message,
          category: breadcrumb.category || 'custom',
          level: breadcrumb.level || 'info',
          data: breadcrumb.data
        });
      }
    } catch (error) {
      logger.error('Failed to add breadcrumb:', error);
    }
  }

  /**
   * Start a transaction (for performance monitoring)
   */
  startTransaction(name, op) {
    try {
      if (this.sentry) {
        return this.sentry.startTransaction({
          name,
          op: op || 'custom'
        });
      }
      return null;
    } catch (error) {
      logger.error('Failed to start transaction:', error);
      return null;
    }
  }

  /**
   * Express error handler middleware
   */
  expressErrorHandler() {
    if (this.sentry) {
      return this.sentry.Handlers.errorHandler({
        shouldHandleError(error) {
          // Capture all 4xx and 5xx errors
          return true;
        }
      });
    }

    // Fallback error handler
    return (err, req, res, next) => {
      this.captureException(err, {
        tags: {
          path: req.path,
          method: req.method
        },
        extra: {
          body: req.body,
          query: req.query,
          params: req.params
        },
        user: req.user
      });
      next(err);
    };
  }

  /**
   * Express request handler middleware
   */
  expressRequestHandler() {
    if (this.sentry) {
      return this.sentry.Handlers.requestHandler({
        user: ['id', 'username', 'email']
      });
    }

    // Fallback noop middleware
    return (req, res, next) => next();
  }

  /**
   * Express tracing handler middleware
   */
  expressTracingHandler() {
    if (this.sentry) {
      return this.sentry.Handlers.tracingHandler();
    }

    // Fallback noop middleware
    return (req, res, next) => next();
  }

  /**
   * Flush pending events (useful before shutdown)
   */
  async flush(timeout = 2000) {
    try {
      if (this.sentry) {
        await this.sentry.close(timeout);
        logger.info('Sentry events flushed');
      }
    } catch (error) {
      logger.error('Failed to flush Sentry events:', error);
    }
  }

  /**
   * Capture unhandled rejections
   */
  captureUnhandledRejection(reason, promise) {
    this.captureException(reason, {
      tags: {
        type: 'unhandled_rejection'
      },
      extra: {
        promise: promise.toString()
      }
    });
  }

  /**
   * Capture uncaught exceptions
   */
  captureUncaughtException(error) {
    this.captureException(error, {
      tags: {
        type: 'uncaught_exception'
      }
    });
  }
}

// Singleton instance
const errorTrackingService = new ErrorTrackingService();

// Auto-initialize if DSN is set
if (process.env.SENTRY_DSN) {
  errorTrackingService.initialize();
}

// Setup global error handlers
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', reason);
  errorTrackingService.captureUnhandledRejection(reason, promise);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  errorTrackingService.captureUncaughtException(error);

  // Give Sentry time to send the event before exiting
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

module.exports = errorTrackingService;
