/**
 * Two-Factor Authentication Middleware
 *
 * Implements TOTP-based 2FA using speakeasy
 */

const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const logger = require('../utils/logger');
const { User } = require('../models');

/**
 * Generate 2FA secret for user
 * @param {string} email - User email
 * @returns {Object} Secret and QR code
 */
async function generate2FASecret(email) {
  const secret = speakeasy.generateSecret({
    name: `MySoulmate (${email})`,
    issuer: process.env.TWO_FACTOR_ISSUER || 'MySoulmate',
    length: 32
  });

  try {
    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode: qrCodeDataUrl,
      otpauthUrl: secret.otpauth_url
    };
  } catch (error) {
    logger.error('Failed to generate QR code:', error);
    throw error;
  }
}

/**
 * Verify 2FA token
 * @param {string} secret - User's 2FA secret
 * @param {string} token - 6-digit token from authenticator app
 * @returns {boolean} Valid or not
 */
function verify2FAToken(secret, token) {
  try {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time steps before/after for clock drift
    });
  } catch (error) {
    logger.error('2FA token verification error:', error);
    return false;
  }
}

/**
 * Middleware to require 2FA verification
 * Use this after auth middleware on protected routes
 */
const require2FA = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    // Get user from database
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(401).json({
        error: 'User not found'
      });
    }

    // If 2FA is not enabled for this user, skip
    if (!user.twoFactorEnabled) {
      return next();
    }

    // Check for 2FA token in headers
    const twoFactorToken = req.headers['x-2fa-token'] || req.body.twoFactorToken;

    if (!twoFactorToken) {
      return res.status(403).json({
        error: '2FA token required',
        code: '2FA_REQUIRED'
      });
    }

    // Verify the token
    const isValid = verify2FAToken(user.twoFactorSecret, twoFactorToken);

    if (!isValid) {
      logger.warn('Invalid 2FA token attempt', {
        userId: user.id,
        ip: req.ip
      });

      return res.status(403).json({
        error: 'Invalid 2FA token',
        code: 'INVALID_2FA_TOKEN'
      });
    }

    // Token is valid, proceed
    logger.info('2FA verification successful', { userId: user.id });
    next();
  } catch (error) {
    logger.error('2FA middleware error:', error);
    res.status(500).json({
      error: 'Internal server error during 2FA verification'
    });
  }
};

/**
 * Generate backup codes for 2FA recovery
 * @returns {Array<string>} Array of 10 backup codes
 */
function generateBackupCodes() {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    // Generate 8-character alphanumeric code
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  return codes;
}

/**
 * Verify backup code
 * @param {Array<string>} backupCodes - User's backup codes
 * @param {string} code - Code to verify
 * @returns {Object} Result with valid flag and remaining codes
 */
function verifyBackupCode(backupCodes, code) {
  const upperCode = code.toUpperCase();
  const index = backupCodes.indexOf(upperCode);

  if (index === -1) {
    return {
      valid: false,
      remainingCodes: backupCodes
    };
  }

  // Remove used code
  const remainingCodes = [...backupCodes];
  remainingCodes.splice(index, 1);

  return {
    valid: true,
    remainingCodes
  };
}

module.exports = {
  generate2FASecret,
  verify2FAToken,
  require2FA,
  generateBackupCodes,
  verifyBackupCode
};
