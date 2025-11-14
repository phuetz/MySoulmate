const crypto = require('crypto');
const { User } = require('../models');
const { sendPasswordResetEmail } = require('../services/emailService');
const { logger } = require('../config/logger');
const { auditLogger } = require('../utils/auditLogger');

/**
 * Contrôleur de réinitialisation de mot de passe
 */

// Stockage temporaire des tokens (en production, utiliser Redis)
const resetTokens = new Map();

// Nettoyer les tokens expirés toutes les heures
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of resetTokens.entries()) {
    if (data.expiresAt < now) {
      resetTokens.delete(token);
    }
  }
}, 60 * 60 * 1000);

/**
 * Demande de réinitialisation de mot de passe
 * POST /api/v1/password-reset/request
 */
exports.requestPasswordReset = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email requis',
      });
    }

    // Trouver l'utilisateur
    const user = await User.findOne({ where: { email: email.toLowerCase() } });

    // Ne pas révéler si l'email existe ou non (sécurité)
    // Toujours retourner succès
    if (!user) {
      logger.info('Password reset requested for non-existent email:', email);
      await auditLogger.log({
        action: 'password_reset_request_failed',
        ipAddress: req.ip,
        details: { email, reason: 'user_not_found' },
      });

      return res.status(200).json({
        success: true,
        message: 'Si cet email existe, un lien de réinitialisation a été envoyé.',
      });
    }

    // Générer un token sécurisé
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Stocker le token avec expiration (1 heure)
    resetTokens.set(hashedToken, {
      userId: user.id,
      email: user.email,
      expiresAt: Date.now() + 60 * 60 * 1000, // 1 heure
      createdAt: Date.now(),
    });

    // Envoyer l'email
    try {
      await sendPasswordResetEmail(user.email, user.name, resetToken);

      await auditLogger.log({
        action: 'password_reset_request',
        userId: user.id,
        status: 'success',
        ipAddress: req.ip,
        details: { email: user.email },
      });

      logger.info('Password reset email sent:', { userId: user.id, email: user.email });
    } catch (emailError) {
      logger.error('Failed to send password reset email:', emailError);
      // Ne pas révéler l'erreur à l'utilisateur
    }

    res.status(200).json({
      success: true,
      message: 'Si cet email existe, un lien de réinitialisation a été envoyé.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Vérification du token de réinitialisation
 * POST /api/v1/password-reset/verify
 */
exports.verifyResetToken = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token requis',
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const tokenData = resetTokens.get(hashedToken);

    if (!tokenData) {
      return res.status(400).json({
        success: false,
        message: 'Token invalide ou expiré',
      });
    }

    if (tokenData.expiresAt < Date.now()) {
      resetTokens.delete(hashedToken);
      return res.status(400).json({
        success: false,
        message: 'Token expiré',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Token valide',
      email: tokenData.email,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Réinitialisation du mot de passe
 * POST /api/v1/password-reset/reset
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token et nouveau mot de passe requis',
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const tokenData = resetTokens.get(hashedToken);

    if (!tokenData) {
      return res.status(400).json({
        success: false,
        message: 'Token invalide ou expiré',
      });
    }

    if (tokenData.expiresAt < Date.now()) {
      resetTokens.delete(hashedToken);
      return res.status(400).json({
        success: false,
        message: 'Token expiré',
      });
    }

    // Trouver l'utilisateur
    const user = await User.findByPk(tokenData.userId);

    if (!user) {
      resetTokens.delete(hashedToken);
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    // Mettre à jour le mot de passe (le modèle User gère le hachage)
    user.password = newPassword;
    await user.save();

    // Supprimer le token utilisé
    resetTokens.delete(hashedToken);

    // Invalider toutes les sessions existantes (sécurité)
    // TODO: Implémenter avec Redis ou Session model

    await auditLogger.log({
      action: 'password_reset_complete',
      userId: user.id,
      status: 'success',
      ipAddress: req.ip,
      details: { email: user.email },
    });

    logger.info('Password reset successful:', { userId: user.id });

    res.status(200).json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès',
    });
  } catch (error) {
    // Si erreur de validation de mot de passe
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe invalide',
        errors: error.errors.map((e) => e.message),
      });
    }

    next(error);
  }
};

/**
 * Statistiques des tokens (admin uniquement)
 * GET /api/v1/password-reset/stats
 */
exports.getResetStats = async (req, res, next) => {
  try {
    const now = Date.now();
    const stats = {
      totalTokens: resetTokens.size,
      activeTokens: 0,
      expiredTokens: 0,
    };

    for (const tokenData of resetTokens.values()) {
      if (tokenData.expiresAt > now) {
        stats.activeTokens++;
      } else {
        stats.expiredTokens++;
      }
    }

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
