const express = require('express');
const router = express.Router();
const passwordResetController = require('../controllers/passwordResetController');
const { userRateLimit } = require('../middleware/rateLimitMiddleware');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

/**
 * Routes de réinitialisation de mot de passe
 */

// Demande de réinitialisation (limitée à 3 par 15 minutes par IP)
router.post(
  '/request',
  userRateLimit({ windowMs: 15 * 60 * 1000, max: 3 }),
  passwordResetController.requestPasswordReset
);

// Vérification du token
router.post('/verify', passwordResetController.verifyResetToken);

// Réinitialisation du mot de passe
router.post('/reset', passwordResetController.resetPassword);

// Stats (admin uniquement)
router.get('/stats', authenticate, requireRole('admin'), passwordResetController.getResetStats);

module.exports = router;
