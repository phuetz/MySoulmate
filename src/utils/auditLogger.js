/**
 * Audit logging utility
 * Provides functions for logging security-sensitive operations
 */
const logger = require('./logger');

// Will be initialized after models are loaded
let AuditLog = null;

/**
 * Initialize audit logger with models
 * @param {Object} models - Database models
 */
exports.initialize = (models) => {
  AuditLog = models.AuditLog;
};

/**
 * Action types for audit logging
 */
exports.ACTIONS = {
  // Authentication actions
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  LOGIN_FAILED: 'LOGIN_FAILED',
  REGISTER: 'REGISTER',
  PASSWORD_RESET_REQUEST: 'PASSWORD_RESET_REQUEST',
  PASSWORD_RESET: 'PASSWORD_RESET',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  EMAIL_VERIFICATION: 'EMAIL_VERIFICATION',
  TOKEN_REFRESH: 'TOKEN_REFRESH',

  // User management
  USER_CREATE: 'USER_CREATE',
  USER_UPDATE: 'USER_UPDATE',
  USER_DELETE: 'USER_DELETE',
  USER_DEACTIVATE: 'USER_DEACTIVATE',
  USER_ACTIVATE: 'USER_ACTIVATE',

  // Admin actions
  ROLE_CHANGE: 'ROLE_CHANGE',
  ADMIN_ACCESS: 'ADMIN_ACCESS',

  // Data operations
  DATA_EXPORT: 'DATA_EXPORT',
  DATA_IMPORT: 'DATA_IMPORT',
  BULK_DELETE: 'BULK_DELETE',

  // Payment operations
  PAYMENT_INITIATED: 'PAYMENT_INITIATED',
  PAYMENT_COMPLETED: 'PAYMENT_COMPLETED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  REFUND_INITIATED: 'REFUND_INITIATED',

  // Security events
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
  ACCESS_DENIED: 'ACCESS_DENIED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  SESSION_TIMEOUT: 'SESSION_TIMEOUT',
  INVALID_TOKEN: 'INVALID_TOKEN'
};

/**
 * Log an audit event
 * @param {Object} params - Audit log parameters
 * @param {string} params.action - Action type
 * @param {string} params.userId - User ID (optional)
 * @param {string} params.resource - Resource affected (optional)
 * @param {string} params.status - Status (success, failure, pending)
 * @param {string} params.ipAddress - IP address
 * @param {string} params.userAgent - User agent
 * @param {Object} params.details - Additional details
 * @param {string} params.errorMessage - Error message if failure
 * @param {Object} params.metadata - Additional metadata
 * @returns {Promise<Object>} Created audit log
 */
exports.log = async ({
  action,
  userId = null,
  resource = null,
  status = 'success',
  ipAddress = null,
  userAgent = null,
  details = null,
  errorMessage = null,
  metadata = null
}) => {
  try {
    if (!AuditLog) {
      logger.warn('AuditLog model not initialized, skipping audit log');
      return null;
    }

    const auditLog = await AuditLog.create({
      userId,
      action,
      resource,
      status,
      ipAddress,
      userAgent,
      details,
      errorMessage,
      metadata
    });

    logger.info(`Audit: ${action} - ${status}`, {
      userId,
      resource,
      ipAddress
    });

    return auditLog;
  } catch (error) {
    logger.error('Failed to create audit log:', error);
    // Don't throw - audit logging should not break the application
    return null;
  }
};

/**
 * Extract request information for audit logging
 * @param {Object} req - Express request object
 * @returns {Object} Request information
 */
exports.extractRequestInfo = (req) => {
  return {
    ipAddress: req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'] || null,
    userId: req.user?.id || null
  };
};

/**
 * Middleware to automatically log certain actions
 * @param {string} action - Action type
 * @param {Function} getResource - Function to extract resource from request
 * @returns {Function} Express middleware
 */
exports.auditMiddleware = (action, getResource = null) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    const requestInfo = this.extractRequestInfo(req);

    res.json = function (data) {
      // Log after response
      setImmediate(async () => {
        try {
          const resource = getResource ? await getResource(req, data) : null;
          const status = res.statusCode >= 200 && res.statusCode < 400 ? 'success' : 'failure';

          await exports.log({
            action,
            ...requestInfo,
            resource,
            status,
            details: {
              statusCode: res.statusCode,
              method: req.method,
              path: req.path
            }
          });
        } catch (error) {
          logger.error('Audit middleware error:', error);
        }
      });

      return originalJson(data);
    };

    next();
  };
};

/**
 * Log authentication event
 * @param {Object} req - Express request object
 * @param {string} action - Action type
 * @param {Object} user - User object
 * @param {string} status - Status
 * @param {string} errorMessage - Error message if failed
 */
exports.logAuth = async (req, action, user = null, status = 'success', errorMessage = null) => {
  const requestInfo = this.extractRequestInfo(req);

  await this.log({
    action,
    userId: user?.id || null,
    resource: user ? `user:${user.id}` : null,
    status,
    ...requestInfo,
    errorMessage,
    details: {
      email: user?.email,
      method: req.method,
      path: req.path
    }
  });
};

/**
 * Get audit logs for a user
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Audit logs
 */
exports.getUserAuditLogs = async (userId, options = {}) => {
  if (!AuditLog) {
    throw new Error('AuditLog model not initialized');
  }

  const limit = options.limit || 50;
  const offset = options.offset || 0;

  return await AuditLog.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    limit,
    offset,
    attributes: { exclude: ['userAgent'] }
  });
};

/**
 * Get recent security events
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Security events
 */
exports.getSecurityEvents = async (options = {}) => {
  if (!AuditLog) {
    throw new Error('AuditLog model not initialized');
  }

  const limit = options.limit || 100;
  const securityActions = [
    this.ACTIONS.LOGIN_FAILED,
    this.ACTIONS.ACCESS_DENIED,
    this.ACTIONS.SUSPICIOUS_ACTIVITY,
    this.ACTIONS.RATE_LIMIT_EXCEEDED,
    this.ACTIONS.INVALID_TOKEN
  ];

  return await AuditLog.findAll({
    where: {
      action: securityActions,
      status: 'failure'
    },
    order: [['createdAt', 'DESC']],
    limit
  });
};
