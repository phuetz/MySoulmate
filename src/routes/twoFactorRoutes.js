const express = require('express');
const router = express.Router();
const twoFactorController = require('../controllers/twoFactorController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');
const { userRateLimit } = require('../middleware/rateLimitMiddleware');

/**
 * Routes d'authentification à deux facteurs (2FA)
 * Toutes les routes nécessitent une authentification
 */

// Statut 2FA
router.get('/status', authenticate, twoFactorController.get2FAStatus);

// TOTP (Google Authenticator)
router.post('/totp/enable', authenticate, twoFactorController.enableTOTP);
router.post(
  '/totp/verify',
  authenticate,
  userRateLimit({ windowMs: 15 * 60 * 1000, max: 10 }),
  twoFactorController.verifyAndEnableTOTP
);

// Email 2FA
router.post(
  '/email/enable',
  authenticate,
  userRateLimit({ windowMs: 15 * 60 * 1000, max: 5 }),
  twoFactorController.enableEmailTwoFactor
);
router.post(
  '/email/verify',
  authenticate,
  userRateLimit({ windowMs: 15 * 60 * 1000, max: 10 }),
  twoFactorController.verifyAndEnableEmailTwoFactor
);

// Désactivation 2FA
router.post('/disable', authenticate, twoFactorController.disable2FA);

// Codes de récupération
router.post(
  '/backup-codes/regenerate',
  authenticate,
  twoFactorController.regenerateBackupCodes
);

// Stats (admin uniquement)
router.get('/stats', authenticate, requireRole('admin'), twoFactorController.get2FAStats);

module.exports = router;
