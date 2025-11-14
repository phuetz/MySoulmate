const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { sendTwoFactorCode } = require('./emailService');
const { logger } = require('../config/logger');

/**
 * Service d'authentification à deux facteurs (2FA)
 * Supporte TOTP (Google Authenticator) et Email
 */

// Stockage temporaire des codes email (en production, utiliser Redis)
const emailCodes = new Map();

// Nettoyer les codes expirés toutes les 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of emailCodes.entries()) {
    if (data.expiresAt < now) {
      emailCodes.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Génère un secret TOTP pour Google Authenticator
 */
exports.generateTOTPSecret = (userEmail, userName = 'MySoulmate User') => {
  const secret = speakeasy.generateSecret({
    name: `MySoulmate (${userEmail})`,
    issuer: 'MySoulmate',
    length: 32,
  });

  return {
    secret: secret.base32,
    otpauth_url: secret.otpauth_url,
  };
};

/**
 * Génère un QR code pour configurer Google Authenticator
 */
exports.generateQRCode = async (otpauth_url) => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(otpauth_url);
    return qrCodeDataURL;
  } catch (error) {
    logger.error('Failed to generate QR code:', error);
    throw new Error('Erreur lors de la génération du QR code');
  }
};

/**
 * Vérifie un code TOTP
 */
exports.verifyTOTP = (secret, token) => {
  const verified = speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2, // Accepte les codes +/- 2 intervalles (60 secondes)
  });

  return verified;
};

/**
 * Génère un code 2FA par email (6 chiffres)
 */
exports.generateEmailCode = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Envoie un code 2FA par email
 */
exports.sendEmailCode = async (userId, userEmail, userName) => {
  try {
    // Générer un code à 6 chiffres
    const code = exports.generateEmailCode();

    // Stocker le code avec expiration (10 minutes)
    const key = `${userId}:${userEmail}`;
    emailCodes.set(key, {
      code,
      attempts: 0,
      maxAttempts: 5,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      createdAt: Date.now(),
    });

    // Envoyer par email
    await sendTwoFactorCode(userEmail, userName, code);

    logger.info('2FA email code sent:', { userId, email: userEmail });

    return { success: true, expiresIn: 600 }; // 600 secondes
  } catch (error) {
    logger.error('Failed to send 2FA email code:', error);
    throw new Error('Erreur lors de l\'envoi du code 2FA');
  }
};

/**
 * Vérifie un code 2FA par email
 */
exports.verifyEmailCode = (userId, userEmail, code) => {
  const key = `${userId}:${userEmail}`;
  const storedData = emailCodes.get(key);

  if (!storedData) {
    return {
      verified: false,
      error: 'Code invalide ou expiré',
    };
  }

  // Vérifier l'expiration
  if (storedData.expiresAt < Date.now()) {
    emailCodes.delete(key);
    return {
      verified: false,
      error: 'Code expiré',
    };
  }

  // Vérifier le nombre de tentatives
  if (storedData.attempts >= storedData.maxAttempts) {
    emailCodes.delete(key);
    return {
      verified: false,
      error: 'Trop de tentatives. Demandez un nouveau code.',
    };
  }

  // Incrémenter les tentatives
  storedData.attempts++;

  // Vérifier le code
  if (storedData.code === code) {
    emailCodes.delete(key); // Code utilisé avec succès
    return {
      verified: true,
    };
  }

  // Code incorrect
  const attemptsLeft = storedData.maxAttempts - storedData.attempts;
  return {
    verified: false,
    error: `Code incorrect. ${attemptsLeft} tentative(s) restante(s).`,
    attemptsLeft,
  };
};

/**
 * Génère des codes de récupération (backup codes)
 */
exports.generateBackupCodes = (count = 10) => {
  const codes = [];
  for (let i = 0; i < count; i++) {
    // Format: XXXX-XXXX (8 caractères alphanumériques)
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    const formatted = `${code.slice(0, 4)}-${code.slice(4, 8)}`;
    codes.push(formatted);
  }
  return codes;
};

/**
 * Hash un code de récupération pour le stockage sécurisé
 */
exports.hashBackupCode = (code) => {
  return crypto.createHash('sha256').update(code).digest('hex');
};

/**
 * Vérifie un code de récupération
 */
exports.verifyBackupCode = (code, hashedCodes) => {
  const hashedInput = exports.hashBackupCode(code);
  return hashedCodes.includes(hashedInput);
};

/**
 * Middleware pour vérifier 2FA
 */
exports.require2FA = (method = 'any') => {
  return async (req, res, next) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise',
      });
    }

    // Si l'utilisateur n'a pas activé 2FA, passer
    if (!user.twoFactorEnabled) {
      return next();
    }

    // Vérifier si 2FA a été validé pour cette session
    const twoFactorVerified = req.headers['x-2fa-verified'];
    const sessionToken = req.headers['x-session-token'];

    if (twoFactorVerified === 'true' && sessionToken) {
      // Vérifier que le token de session correspond
      // TODO: Implémenter la vérification du token de session 2FA
      return next();
    }

    // 2FA requis mais non fourni
    return res.status(403).json({
      success: false,
      message: 'Authentification à deux facteurs requise',
      code: '2FA_REQUIRED',
      methods: user.twoFactorMethod || ['totp', 'email'],
    });
  };
};

/**
 * Statistiques 2FA (admin uniquement)
 */
exports.get2FAStats = () => {
  const now = Date.now();
  const stats = {
    activeEmailCodes: 0,
    expiredEmailCodes: 0,
    totalEmailCodes: emailCodes.size,
  };

  for (const data of emailCodes.values()) {
    if (data.expiresAt > now) {
      stats.activeEmailCodes++;
    } else {
      stats.expiredEmailCodes++;
    }
  }

  return stats;
};
