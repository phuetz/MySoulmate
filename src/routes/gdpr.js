/**
 * GDPR Compliance Routes
 *
 * Implements GDPR data protection requirements:
 * - Right to access
 * - Right to erasure
 * - Right to data portability
 */

const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { protect } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

/**
 * @route   GET /api/v1/gdpr/export
 * @desc    Export all user data (GDPR right to data portability)
 * @access  Private
 */
router.get('/export', protect, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user data
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password', 'twoFactorSecret'] }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Collect all user data from various tables
    const userData = {
      profile: user.toJSON(),
      exportDate: new Date().toISOString(),
      exportedBy: user.email
    };

    // Note: In a real implementation, you would gather data from:
    // - Messages
    // - Companions
    // - Gifts
    // - Transactions
    // - Sessions
    // - Analytics events
    // etc.

    logger.info('GDPR data export requested', {
      userId,
      email: user.email
    });

    res.status(200).json({
      message: 'Your data export is ready',
      data: userData,
      format: 'JSON',
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    logger.error('GDPR export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

/**
 * @route   POST /api/v1/gdpr/delete
 * @desc    Request account deletion (GDPR right to erasure)
 * @access  Private
 */
router.post('/delete', protect, async (req, res) => {
  try {
    const { password, confirmation } = req.body;

    if (!password || confirmation !== 'DELETE') {
      return res.status(400).json({
        error: 'Password and confirmation ("DELETE") required'
      });
    }

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify password
    const isValid = await user.isPasswordValid(password);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    // In production, you might:
    // 1. Schedule deletion after 30 days (grace period)
    // 2. Anonymize instead of delete (for legal/audit reasons)
    // 3. Keep minimal data for compliance

    logger.warn('Account deletion requested', {
      userId: user.id,
      email: user.email,
      ip: req.ip
    });

    // For now, just mark as inactive
    await user.update({
      isActive: false,
      deletionRequested: new Date()
    });

    res.status(200).json({
      message: 'Account deletion requested',
      scheduledFor: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      note: 'You have 30 days to cancel this request by logging in again'
    });
  } catch (error) {
    logger.error('GDPR deletion error:', error);
    res.status(500).json({ error: 'Failed to process deletion request' });
  }
});

/**
 * @route   GET /api/v1/gdpr/info
 * @desc    Get information about data collection
 * @access  Public
 */
router.get('/info', (req, res) => {
  res.status(200).json({
    dataCollected: [
      'Personal information (name, email)',
      'Authentication data (hashed passwords, tokens)',
      'Messages and conversations with AI companion',
      'Usage analytics and preferences',
      'Payment information (via Stripe, not stored directly)',
      'Device information and IP addresses'
    ],
    dataUsage: [
      'Provide and improve our services',
      'Personalize your experience',
      'Process payments',
      'Send notifications',
      'Comply with legal obligations'
    ],
    dataRetention: {
      activeUsers: 'Data retained while account is active',
      deletedAccounts: '30 days grace period, then anonymized',
      backups: 'Backup data retained for 90 days'
    },
    yourRights: [
      'Right to access your data',
      'Right to rectification',
      'Right to erasure ("right to be forgotten")',
      'Right to data portability',
      'Right to restrict processing',
      'Right to object'
    ],
    contact: {
      email: 'privacy@mysoulmate.app',
      dataProtectionOfficer: 'dpo@mysoulmate.app'
    }
  });
});

/**
 * @route   POST /api/v1/gdpr/consent
 * @desc    Update consent preferences
 * @access  Private
 */
router.post('/consent', protect, async (req, res) => {
  try {
    const {
      analytics,
      marketing,
      personalization
    } = req.body;

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Store consent preferences
    const consent = {
      analytics: analytics === true,
      marketing: marketing === true,
      personalization: personalization === true,
      updatedAt: new Date().toISOString()
    };

    await user.update({
      consentPreferences: JSON.stringify(consent)
    });

    logger.info('Consent preferences updated', {
      userId: user.id,
      consent
    });

    res.status(200).json({
      message: 'Consent preferences updated',
      consent
    });
  } catch (error) {
    logger.error('Consent update error:', error);
    res.status(500).json({ error: 'Failed to update consent' });
  }
});

module.exports = router;
