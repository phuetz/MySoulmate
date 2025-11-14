const { User } = require('../models');
const twoFactorService = require('../services/twoFactorService');
const { logger } = require('../config/logger');
const { auditLogger } = require('../utils/auditLogger');

/**
 * Contrôleur d'authentification à deux facteurs
 */

/**
 * Active 2FA TOTP (Google Authenticator)
 * POST /api/v1/2fa/totp/enable
 */
exports.enableTOTP = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    // Générer un nouveau secret
    const { secret, otpauth_url } = twoFactorService.generateTOTPSecret(
      user.email,
      user.name
    );

    // Générer le QR code
    const qrCode = await twoFactorService.generateQRCode(otpauth_url);

    // Stocker temporairement le secret (non activé tant que non vérifié)
    user.twoFactorSecret = secret;
    user.twoFactorEnabled = false; // Sera activé après vérification
    await user.save();

    logger.info('TOTP 2FA setup initiated:', { userId });

    res.status(200).json({
      success: true,
      message: 'Scannez ce QR code avec Google Authenticator',
      data: {
        secret,
        qrCode,
        otpauth_url,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Vérifie et active 2FA TOTP
 * POST /api/v1/2fa/totp/verify
 */
exports.verifyAndEnableTOTP = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Code de vérification requis',
      });
    }

    const user = await User.findByPk(userId);

    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({
        success: false,
        message: 'Configuration 2FA non initialisée',
      });
    }

    // Vérifier le token
    const verified = twoFactorService.verifyTOTP(user.twoFactorSecret, token);

    if (!verified) {
      await auditLogger.log({
        action: '2fa_totp_verify_failed',
        userId,
        status: 'failed',
        ipAddress: req.ip,
      });

      return res.status(400).json({
        success: false,
        message: 'Code invalide',
      });
    }

    // Générer des codes de récupération
    const backupCodes = twoFactorService.generateBackupCodes(10);
    const hashedBackupCodes = backupCodes.map((code) =>
      twoFactorService.hashBackupCode(code)
    );

    // Activer 2FA
    user.twoFactorEnabled = true;
    user.twoFactorMethod = 'totp';
    user.twoFactorBackupCodes = JSON.stringify(hashedBackupCodes);
    await user.save();

    await auditLogger.log({
      action: '2fa_totp_enabled',
      userId,
      status: 'success',
      ipAddress: req.ip,
    });

    logger.info('TOTP 2FA enabled successfully:', { userId });

    res.status(200).json({
      success: true,
      message: '2FA activée avec succès',
      data: {
        backupCodes, // À afficher une seule fois à l'utilisateur
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Configure 2FA par Email
 * POST /api/v1/2fa/email/enable
 */
exports.enableEmailTwoFactor = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    // Envoyer un code de vérification
    await twoFactorService.sendEmailCode(userId, user.email, user.name);

    logger.info('Email 2FA setup initiated:', { userId, email: user.email });

    res.status(200).json({
      success: true,
      message: 'Un code de vérification a été envoyé à votre email',
      expiresIn: 600, // 10 minutes
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Vérifie et active 2FA par Email
 * POST /api/v1/2fa/email/verify
 */
exports.verifyAndEnableEmailTwoFactor = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Code de vérification requis',
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    // Vérifier le code
    const result = twoFactorService.verifyEmailCode(userId, user.email, code);

    if (!result.verified) {
      await auditLogger.log({
        action: '2fa_email_verify_failed',
        userId,
        status: 'failed',
        ipAddress: req.ip,
        details: { error: result.error },
      });

      return res.status(400).json({
        success: false,
        message: result.error,
        attemptsLeft: result.attemptsLeft,
      });
    }

    // Générer des codes de récupération
    const backupCodes = twoFactorService.generateBackupCodes(10);
    const hashedBackupCodes = backupCodes.map((code) =>
      twoFactorService.hashBackupCode(code)
    );

    // Activer 2FA
    user.twoFactorEnabled = true;
    user.twoFactorMethod = 'email';
    user.twoFactorBackupCodes = JSON.stringify(hashedBackupCodes);
    await user.save();

    await auditLogger.log({
      action: '2fa_email_enabled',
      userId,
      status: 'success',
      ipAddress: req.ip,
    });

    logger.info('Email 2FA enabled successfully:', { userId });

    res.status(200).json({
      success: true,
      message: '2FA par email activée avec succès',
      data: {
        backupCodes,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Désactive 2FA
 * POST /api/v1/2fa/disable
 */
exports.disable2FA = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe requis pour désactiver 2FA',
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe incorrect',
      });
    }

    // Désactiver 2FA
    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    user.twoFactorMethod = null;
    user.twoFactorBackupCodes = null;
    await user.save();

    await auditLogger.log({
      action: '2fa_disabled',
      userId,
      status: 'success',
      ipAddress: req.ip,
    });

    logger.info('2FA disabled:', { userId });

    res.status(200).json({
      success: true,
      message: '2FA désactivée avec succès',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Régénère les codes de récupération
 * POST /api/v1/2fa/backup-codes/regenerate
 */
exports.regenerateBackupCodes = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe requis',
      });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: '2FA non activée',
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe incorrect',
      });
    }

    // Générer de nouveaux codes
    const backupCodes = twoFactorService.generateBackupCodes(10);
    const hashedBackupCodes = backupCodes.map((code) =>
      twoFactorService.hashBackupCode(code)
    );

    user.twoFactorBackupCodes = JSON.stringify(hashedBackupCodes);
    await user.save();

    await auditLogger.log({
      action: '2fa_backup_codes_regenerated',
      userId,
      status: 'success',
      ipAddress: req.ip,
    });

    logger.info('Backup codes regenerated:', { userId });

    res.status(200).json({
      success: true,
      message: 'Codes de récupération régénérés',
      data: {
        backupCodes,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupère le statut 2FA
 * GET /api/v1/2fa/status
 */
exports.get2FAStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        enabled: user.twoFactorEnabled || false,
        method: user.twoFactorMethod || null,
        hasBackupCodes: !!user.twoFactorBackupCodes,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Statistiques 2FA (admin uniquement)
 * GET /api/v1/2fa/stats
 */
exports.get2FAStats = async (req, res, next) => {
  try {
    const stats = twoFactorService.get2FAStats();

    // Compter les utilisateurs avec 2FA
    const totalUsers = await User.count();
    const users2FAEnabled = await User.count({ where: { twoFactorEnabled: true } });
    const users2FATOTP = await User.count({ where: { twoFactorMethod: 'totp' } });
    const users2FAEmail = await User.count({ where: { twoFactorMethod: 'email' } });

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          with2FA: users2FAEnabled,
          totp: users2FATOTP,
          email: users2FAEmail,
          percentage: ((users2FAEnabled / totalUsers) * 100).toFixed(2) + '%',
        },
        emailCodes: stats,
      },
    });
  } catch (error) {
    next(error);
  }
};
