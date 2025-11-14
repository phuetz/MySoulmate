/**
 * Audit Logging Service
 * Comprehensive logging of all user actions and system events
 */

const logger = require('../config/logger');

class AuditLogService {
  /**
   * Log an action
   */
  async log(action, details = {}) {
    try {
      const { AuditLog } = require('../models');

      const logEntry = {
        userId: details.userId || null,
        action,
        resource: details.resource || null,
        resourceId: details.resourceId || null,
        ipAddress: details.ipAddress || null,
        userAgent: details.userAgent || null,
        changes: details.changes ? JSON.stringify(details.changes) : null,
        metadata: details.metadata ? JSON.stringify(details.metadata) : null,
        status: details.status || 'success',
        errorMessage: details.errorMessage || null,
        timestamp: new Date()
      };

      await AuditLog.create(logEntry);

      // Also log to Winston for immediate visibility
      logger.info('Audit log:', { action, ...details });
    } catch (error) {
      logger.error('Failed to create audit log:', error);
    }
  }

  /**
   * Log authentication events
   */
  async logAuth(action, userId, details = {}) {
    await this.log(`auth.${action}`, {
      userId,
      resource: 'authentication',
      ...details
    });
  }

  /**
   * Log user creation
   */
  async logUserCreated(userId, details = {}) {
    await this.log('user.created', {
      userId,
      resource: 'user',
      resourceId: userId,
      ...details
    });
  }

  /**
   * Log user update
   */
  async logUserUpdated(userId, changes, details = {}) {
    await this.log('user.updated', {
      userId,
      resource: 'user',
      resourceId: userId,
      changes,
      ...details
    });
  }

  /**
   * Log user deletion
   */
  async logUserDeleted(userId, details = {}) {
    await this.log('user.deleted', {
      userId,
      resource: 'user',
      resourceId: userId,
      ...details
    });
  }

  /**
   * Log data access
   */
  async logDataAccess(userId, resource, resourceId, details = {}) {
    await this.log('data.accessed', {
      userId,
      resource,
      resourceId,
      ...details
    });
  }

  /**
   * Log data export (GDPR)
   */
  async logDataExport(userId, details = {}) {
    await this.log('gdpr.export', {
      userId,
      resource: 'gdpr',
      ...details
    });
  }

  /**
   * Log subscription changes
   */
  async logSubscription(action, userId, subscriptionId, details = {}) {
    await this.log(`subscription.${action}`, {
      userId,
      resource: 'subscription',
      resourceId: subscriptionId,
      ...details
    });
  }

  /**
   * Log purchase
   */
  async logPurchase(userId, productId, amount, details = {}) {
    await this.log('purchase.completed', {
      userId,
      resource: 'product',
      resourceId: productId,
      metadata: { amount, ...details.metadata },
      ...details
    });
  }

  /**
   * Log AI interaction
   */
  async logAIInteraction(userId, interactionType, details = {}) {
    await this.log('ai.interaction', {
      userId,
      resource: 'ai',
      metadata: { interactionType, ...details.metadata },
      ...details
    });
  }

  /**
   * Log permission change
   */
  async logPermissionChange(adminUserId, targetUserId, changes, details = {}) {
    await this.log('permission.changed', {
      userId: adminUserId,
      resource: 'user',
      resourceId: targetUserId,
      changes,
      ...details
    });
  }

  /**
   * Log security event
   */
  async logSecurityEvent(event, userId, details = {}) {
    await this.log(`security.${event}`, {
      userId,
      resource: 'security',
      status: details.status || 'warning',
      ...details
    });
  }

  /**
   * Log API key usage
   */
  async logApiKeyUsage(apiKeyId, endpoint, details = {}) {
    await this.log('api.key_used', {
      resource: 'api_key',
      resourceId: apiKeyId,
      metadata: { endpoint, ...details.metadata },
      ...details
    });
  }

  /**
   * Log configuration change
   */
  async logConfigChange(adminUserId, configKey, changes, details = {}) {
    await this.log('config.changed', {
      userId: adminUserId,
      resource: 'configuration',
      resourceId: configKey,
      changes,
      ...details
    });
  }

  /**
   * Get audit logs for a user
   */
  async getUserLogs(userId, options = {}) {
    try {
      const { AuditLog } = require('../models');
      const { Op } = require('sequelize');

      const where = { userId };

      if (options.startDate && options.endDate) {
        where.timestamp = {
          [Op.between]: [options.startDate, options.endDate]
        };
      }

      if (options.action) {
        where.action = { [Op.like]: `${options.action}%` };
      }

      const logs = await AuditLog.findAll({
        where,
        order: [['timestamp', 'DESC']],
        limit: options.limit || 100,
        offset: options.offset || 0
      });

      return logs;
    } catch (error) {
      logger.error('Failed to fetch user logs:', error);
      return [];
    }
  }

  /**
   * Get audit logs for a resource
   */
  async getResourceLogs(resource, resourceId, options = {}) {
    try {
      const { AuditLog } = require('../models');

      const logs = await AuditLog.findAll({
        where: { resource, resourceId },
        order: [['timestamp', 'DESC']],
        limit: options.limit || 100,
        offset: options.offset || 0
      });

      return logs;
    } catch (error) {
      logger.error('Failed to fetch resource logs:', error);
      return [];
    }
  }

  /**
   * Get all audit logs (admin)
   */
  async getAllLogs(options = {}) {
    try {
      const { AuditLog } = require('../models');
      const { Op } = require('sequelize');

      const where = {};

      if (options.startDate && options.endDate) {
        where.timestamp = {
          [Op.between]: [options.startDate, options.endDate]
        };
      }

      if (options.action) {
        where.action = { [Op.like]: `${options.action}%` };
      }

      if (options.userId) {
        where.userId = options.userId;
      }

      if (options.status) {
        where.status = options.status;
      }

      const logs = await AuditLog.findAll({
        where,
        order: [['timestamp', 'DESC']],
        limit: options.limit || 100,
        offset: options.offset || 0
      });

      return logs;
    } catch (error) {
      logger.error('Failed to fetch audit logs:', error);
      return [];
    }
  }

  /**
   * Get audit log statistics
   */
  async getStatistics(startDate, endDate) {
    try {
      const { AuditLog } = require('../models');
      const { Op } = require('sequelize');
      const sequelize = require('../config/database');

      const where = {
        timestamp: {
          [Op.between]: [startDate, endDate]
        }
      };

      // Total logs
      const totalLogs = await AuditLog.count({ where });

      // Logs by action
      const logsByAction = await AuditLog.findAll({
        attributes: [
          'action',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where,
        group: ['action'],
        order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
        limit: 10,
        raw: true
      });

      // Logs by status
      const logsByStatus = await AuditLog.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where,
        group: ['status'],
        raw: true
      });

      // Most active users
      const mostActiveUsers = await AuditLog.findAll({
        attributes: [
          'userId',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        where: {
          ...where,
          userId: { [Op.not]: null }
        },
        group: ['userId'],
        order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
        limit: 10,
        raw: true
      });

      return {
        totalLogs,
        logsByAction,
        logsByStatus,
        mostActiveUsers,
        dateRange: { startDate, endDate }
      };
    } catch (error) {
      logger.error('Failed to get audit statistics:', error);
      return null;
    }
  }

  /**
   * Middleware to automatically log HTTP requests
   */
  middleware() {
    return async (req, res, next) => {
      // Capture original end function
      const originalEnd = res.end;

      // Override end function to log after response
      res.end = async function(...args) {
        // Only log successful requests that modify data
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
          const action = `${req.method.toLowerCase()}.${req.path.replace(/\//g, '.')}`;

          await auditLogService.log(action, {
            userId: req.user ? req.user.id : null,
            resource: req.baseUrl || req.path,
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            status: res.statusCode < 400 ? 'success' : 'error',
            metadata: {
              method: req.method,
              path: req.path,
              statusCode: res.statusCode
            }
          });
        }

        // Call original end
        return originalEnd.apply(res, args);
      };

      next();
    };
  }
}

// Singleton instance
const auditLogService = new AuditLogService();

module.exports = auditLogService;
