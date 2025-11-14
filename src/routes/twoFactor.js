/**
 * Two-Factor Authentication Routes
 */

const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { protect } = require('../middleware/authMiddleware');
const {
  generate2FASecret,
  verify2FAToken,
  generateBackupCodes,
  verifyBackupCode
} = require('../middleware/twoFactorMiddleware');
const logger = require('../utils/logger');
const { encrypt, decrypt } = require('../utils/encryption');

/**
 * @route   POST /api/v1/2fa/setup
 * @desc    Generate 2FA secret and QR code
 * @access  Private
 */
router.post('/setup', protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({
        error: '2FA is already enabled. Disable it first to re-setup.'
      });
    }

    // Generate secret
    const { secret, qrCode, otpauthUrl } = await generate2FASecret(user.email);

    // Store encrypted secret temporarily (will be confirmed later)
    await user.update({
      twoFactorSecret: encrypt(secret)
    });

    res.status(200).json({
      message: '2FA setup initiated',
      qrCode,
      secret, // Show once for manual entry
      otpauthUrl
    });
  } catch (error) {
    logger.error('2FA setup error:', error);
    res.status(500).json({ error: 'Failed to setup 2FA' });
  }
});

/**
 * @route   POST /api/v1/2fa/verify
 * @desc    Verify and enable 2FA
 * @access  Private
 */
router.post('/verify', protect, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const user = await User.findByPk(req.user.id);

    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({
        error: 'Please setup 2FA first'
      });
    }

    if (user.twoFactorEnabled) {
      return res.status(400).json({
        error: '2FA is already enabled'
      });
    }

    // Decrypt secret
    const secret = decrypt(user.twoFactorSecret);

    // Verify token
    const isValid = verify2FAToken(secret, token);

    if (!isValid) {
      return res.status(400).json({
        error: 'Invalid token. Please try again.'
      });
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes();

    // Enable 2FA
    await user.update({
      twoFactorEnabled: true,
      twoFactorBackupCodes: JSON.stringify(backupCodes)
    });

    logger.info('2FA enabled for user', { userId: user.id });

    res.status(200).json({
      message: '2FA enabled successfully',
      backupCodes,
      warning: 'Save these backup codes in a secure location. You will not see them again.'
    });
  } catch (error) {
    logger.error('2FA verification error:', error);
    res.status(500).json({ error: 'Failed to verify 2FA' });
  }
});

/**
 * @route   POST /api/v1/2fa/disable
 * @desc    Disable 2FA
 * @access  Private
 */
router.post('/disable', protect, async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token && !password) {
      return res.status(400).json({
        error: 'Either 2FA token or password is required'
      });
    }

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({
        error: '2FA is not enabled'
      });
    }

    // Verify with password OR 2FA token
    let verified = false;

    if (password) {
      verified = await user.isPasswordValid(password);
    } else if (token) {
      const secret = decrypt(user.twoFactorSecret);
      verified = verify2FAToken(secret, token);
    }

    if (!verified) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Disable 2FA
    await user.update({
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: null
    });

    logger.info('2FA disabled for user', { userId: user.id });

    res.status(200).json({
      message: '2FA disabled successfully'
    });
  } catch (error) {
    logger.error('2FA disable error:', error);
    res.status(500).json({ error: 'Failed to disable 2FA' });
  }
});

/**
 * @route   POST /api/v1/2fa/backup-code
 * @desc    Verify backup code
 * @access  Private
 */
router.post('/backup-code', protect, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Backup code is required' });
    }

    const user = await User.findByPk(req.user.id);

    if (!user || !user.twoFactorEnabled) {
      return res.status(400).json({
        error: '2FA is not enabled'
      });
    }

    const backupCodes = JSON.parse(user.twoFactorBackupCodes || '[]');
    const result = verifyBackupCode(backupCodes, code);

    if (!result.valid) {
      return res.status(401).json({
        error: 'Invalid backup code'
      });
    }

    // Update backup codes
    await user.update({
      twoFactorBackupCodes: JSON.stringify(result.remainingCodes)
    });

    logger.info('Backup code used', {
      userId: user.id,
      remaining: result.remainingCodes.length
    });

    res.status(200).json({
      message: 'Backup code verified',
      remainingCodes: result.remainingCodes.length
    });
  } catch (error) {
    logger.error('Backup code verification error:', error);
    res.status(500).json({ error: 'Failed to verify backup code' });
  }
});

/**
 * @route   GET /api/v1/2fa/status
 * @desc    Get 2FA status
 * @access  Private
 */
router.get('/status', protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const backupCodesCount = user.twoFactorBackupCodes
      ? JSON.parse(user.twoFactorBackupCodes).length
      : 0;

    res.status(200).json({
      enabled: user.twoFactorEnabled || false,
      backupCodesRemaining: backupCodesCount
    });
  } catch (error) {
    logger.error('2FA status error:', error);
    res.status(500).json({ error: 'Failed to get 2FA status' });
  }
});

module.exports = router;
