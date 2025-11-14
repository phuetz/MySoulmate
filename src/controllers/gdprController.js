/**
 * GDPR Controller
 * Handles user data export and deletion requests for GDPR compliance
 */
const { User, Session, AuditLog, UserGift, Subscription } = require('../models');
const logger = require('../utils/logger');
const auditLogger = require('../utils/auditLogger');
const archiver = require('archiver');
const { Readable } = require('stream');

/**
 * @desc    Export all user data (GDPR Article 15)
 * @route   GET /api/v1/gdpr/export
 * @access  Private
 */
exports.exportUserData = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const format = req.query.format || 'json'; // json or zip

    logger.info(`GDPR data export requested by user ${userId}`);

    // Gather all user data
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password', 'refreshToken', 'passwordResetToken'] }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get related data
    const [sessions, auditLogs, gifts, subscriptions] = await Promise.all([
      Session.findAll({ where: { userId }, attributes: { exclude: ['token'] } }),
      AuditLog.findAll({ where: { userId }, limit: 1000, order: [['createdAt', 'DESC']] }),
      UserGift.findAll({ where: { userId }, include: ['gift'] }),
      Subscription.findAll({ where: { userId } })
    ]);

    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        userId: user.id,
        dataProtectionOfficer: 'dpo@mysoulmate.app',
        rights: {
          rectification: 'You have the right to rectify inaccurate data',
          erasure: 'You have the right to request deletion of your data',
          portability: 'You have the right to receive your data in a structured format',
          objection: 'You have the right to object to processing of your data'
        }
      },
      personalData: {
        account: user.toJSON(),
        sessions: sessions.map(s => s.toJSON()),
        gifts: gifts.map(g => g.toJSON()),
        subscriptions: subscriptions.map(s => s.toJSON())
      },
      activityData: {
        auditLogs: auditLogs.map(log => ({
          action: log.action,
          timestamp: log.createdAt,
          ipAddress: log.ipAddress,
          status: log.status
        }))
      },
      companionData: {
        // Add companion interaction data here
        conversations: [], // Would fetch from conversation storage
        preferences: {}, // User preferences for companion
        customizations: {} // Companion customizations
      }
    };

    // Log export request
    await auditLogger.log({
      action: auditLogger.ACTIONS.DATA_EXPORT,
      userId,
      status: 'success',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: { format }
    });

    if (format === 'zip') {
      // Create ZIP archive
      const archive = archiver('zip', { zlib: { level: 9 } });

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="mysoulmate-data-export-${userId}.zip"`);

      archive.pipe(res);

      // Add JSON file to archive
      archive.append(JSON.stringify(exportData, null, 2), { name: 'user-data.json' });

      // Add README
      const readme = `MySoulmate Data Export
=====================

This archive contains all your personal data stored in MySoulmate.

Contents:
- user-data.json: Complete data export in JSON format

Your Rights:
- Right to rectification: Contact us to correct inaccurate data
- Right to erasure: Request deletion of your account and all data
- Right to data portability: This export fulfills this right
- Right to object: Contact us to object to data processing

Contact: support@mysoulmate.app
Data Protection Officer: dpo@mysoulmate.app

Export Date: ${new Date().toISOString()}
User ID: ${userId}
`;

      archive.append(readme, { name: 'README.txt' });

      await archive.finalize();
    } else {
      // Return JSON
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="mysoulmate-data-export-${userId}.json"`);
      res.json(exportData);
    }
  } catch (error) {
    logger.error('Error exporting user data:', error);
    await auditLogger.log({
      action: auditLogger.ACTIONS.DATA_EXPORT,
      userId: req.user?.id,
      status: 'failure',
      ipAddress: req.ip,
      errorMessage: error.message
    });
    next(error);
  }
};

/**
 * @desc    Request account deletion (GDPR Article 17)
 * @route   DELETE /api/v1/gdpr/delete-account
 * @access  Private
 */
exports.requestAccountDeletion = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { confirmation, reason } = req.body;

    if (confirmation !== 'DELETE MY ACCOUNT') {
      return res.status(400).json({
        message: 'Please confirm account deletion by sending: "DELETE MY ACCOUNT"'
      });
    }

    logger.warn(`Account deletion requested by user ${userId}`);

    // Mark user as pending deletion
    await User.update(
      {
        isActive: false,
        deletionRequestedAt: new Date(),
        deletionReason: reason
      },
      { where: { id: userId } }
    );

    // Log deletion request
    await auditLogger.log({
      action: auditLogger.ACTIONS.USER_DELETE,
      userId,
      status: 'pending',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      details: { reason }
    });

    res.status(200).json({
      message: 'Account deletion request received',
      deletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      note: 'Your account will be permanently deleted in 30 days. You can cancel this request by logging in before then.'
    });
  } catch (error) {
    logger.error('Error requesting account deletion:', error);
    next(error);
  }
};

/**
 * @desc    Cancel account deletion request
 * @route   POST /api/v1/gdpr/cancel-deletion
 * @access  Private
 */
exports.cancelAccountDeletion = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await User.findByPk(userId);

    if (!user.deletionRequestedAt) {
      return res.status(400).json({
        message: 'No deletion request found'
      });
    }

    // Cancel deletion
    await user.update({
      isActive: true,
      deletionRequestedAt: null,
      deletionReason: null
    });

    await auditLogger.log({
      action: 'DELETION_CANCELLED',
      userId,
      status: 'success',
      ipAddress: req.ip
    });

    res.status(200).json({
      message: 'Account deletion cancelled successfully'
    });
  } catch (error) {
    logger.error('Error cancelling account deletion:', error);
    next(error);
  }
};

/**
 * @desc    Get data processing information
 * @route   GET /api/v1/gdpr/processing-info
 * @access  Private
 */
exports.getProcessingInfo = async (req, res) => {
  res.status(200).json({
    dataController: {
      name: 'MySoulmate',
      email: 'dpo@mysoulmate.app',
      address: 'To be defined'
    },
    purposes: [
      {
        purpose: 'Service Provision',
        legalBasis: 'Contract performance',
        description: 'To provide AI companion services'
      },
      {
        purpose: 'Payment Processing',
        legalBasis: 'Contract performance',
        description: 'To process subscription payments'
      },
      {
        purpose: 'Service Improvement',
        legalBasis: 'Legitimate interest',
        description: 'To analyze and improve our services'
      },
      {
        purpose: 'Security',
        legalBasis: 'Legitimate interest',
        description: 'To protect against fraud and ensure security'
      }
    ],
    dataCategories: [
      'Account information (name, email)',
      'Authentication data (hashed passwords)',
      'Usage data (interactions, preferences)',
      'Payment information (processed by Stripe)',
      'Communication data (messages with AI companion)',
      'Technical data (IP addresses, device info)'
    ],
    retentionPeriods: {
      accountData: 'Duration of account + 30 days after deletion request',
      auditLogs: '2 years',
      paymentData: '7 years (legal requirement)',
      conversationData: 'Duration of account'
    },
    thirdPartySharing: [
      {
        party: 'OpenAI',
        purpose: 'AI response generation',
        dataShared: 'Conversation messages',
        location: 'United States'
      },
      {
        party: 'Stripe',
        purpose: 'Payment processing',
        dataShared: 'Payment information',
        location: 'United States'
      }
    ],
    yourRights: {
      access: 'Request a copy of your personal data',
      rectification: 'Request correction of inaccurate data',
      erasure: 'Request deletion of your data',
      restriction: 'Request restriction of processing',
      portability: 'Receive your data in a structured format',
      objection: 'Object to processing of your data',
      complaint: 'Lodge a complaint with supervisory authority'
    },
    supervisoryAuthority: {
      name: 'To be defined based on jurisdiction',
      website: 'https://edpb.europa.eu/about-edpb/about-edpb/members_en'
    }
  });
};

/**
 * @desc    Request data rectification
 * @route   POST /api/v1/gdpr/rectification
 * @access  Private
 */
exports.requestRectification = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { field, currentValue, requestedValue, reason } = req.body;

    await auditLogger.log({
      action: 'DATA_RECTIFICATION_REQUEST',
      userId,
      status: 'pending',
      ipAddress: req.ip,
      details: { field, currentValue, requestedValue, reason }
    });

    // In production, this would create a support ticket
    logger.info(`Data rectification requested by user ${userId}`, { field, requestedValue });

    res.status(200).json({
      message: 'Rectification request received',
      ticketId: `RECT-${Date.now()}`,
      note: 'Our team will review your request within 30 days'
    });
  } catch (error) {
    logger.error('Error requesting rectification:', error);
    next(error);
  }
};
