/**
 * Middleware pour l'authentification et l'autorisation
 */
const jwt = require('jsonwebtoken');
const { User, Session } = require('../models');
const logger = require('../utils/logger');

// Session timeout in milliseconds (default: 30 minutes of inactivity)
const SESSION_TIMEOUT = parseInt(process.env.SESSION_TIMEOUT || '1800000');

/**
 * Middleware de protection des routes - vérifie le token JWT
 */
exports.protect = async (req, res, next) => {
  try {
    let token;
    let sessionToken;

    // Vérifier si le token est présent dans les en-têtes
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Récupérer le session token
    sessionToken = req.headers['x-session-token'];

    // Vérifier si le token existe
    if (!token) {
      return res.status(401).json({ message: 'Accès non autorisé, token manquant' });
    }

    try {
      // Vérifier le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre_secret_jwt');

      // Vérifier si l'utilisateur existe toujours
      const user = await User.findByPk(decoded.id);
      if (!user) {
        return res.status(401).json({ message: 'Token invalide, utilisateur non trouvé' });
      }

      // Vérifier si l'utilisateur est actif
      if (!user.isActive) {
        return res.status(401).json({ message: 'Ce compte a été désactivé' });
      }

      // Vérifier la session si le session token est fourni
      if (sessionToken) {
        const session = await Session.findOne({
          where: { token: sessionToken, userId: user.id }
        });

        if (!session) {
          return res.status(401).json({
            message: 'Session invalide',
            code: 'INVALID_SESSION'
          });
        }

        // Vérifier si la session a expiré
        if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
          await session.destroy();
          return res.status(401).json({
            message: 'Session expirée',
            code: 'SESSION_EXPIRED'
          });
        }

        // Vérifier le timeout d'inactivité
        const lastActivity = new Date(session.lastActivityAt || session.updatedAt);
        const timeSinceLastActivity = Date.now() - lastActivity.getTime();

        if (timeSinceLastActivity > SESSION_TIMEOUT) {
          await session.destroy();
          return res.status(401).json({
            message: 'Session expirée en raison d\'inactivité',
            code: 'SESSION_TIMEOUT'
          });
        }

        // Mettre à jour l'activité de la session
        await session.update({ lastActivityAt: new Date() });
      }

      // Ajouter l'utilisateur à la requête
      req.user = decoded;
      next();
    } catch (error) {
      logger.error('Erreur de vérification du token:', error);
      return res.status(401).json({ message: 'Token invalide ou expiré' });
    }
  } catch (error) {
    logger.error('Erreur dans le middleware de protection:', error);
    next(error);
  }
};

/**
 * Middleware pour restreindre l'accès aux administrateurs
 */
exports.restrictToAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Accès réservé aux administrateurs' });
  }
};

/**
 * Middleware pour vérifier si l'utilisateur est le propriétaire ou un admin
 * Utilisation: pour les routes qui nécessitent que l'utilisateur soit le propriétaire de la ressource
 * @param {Function} getResourceUserId - Fonction qui extrait l'ID de l'utilisateur propriétaire de la ressource
 */
exports.isOwnerOrAdmin = (getResourceUserId) => {
  return async (req, res, next) => {
    try {
      // Vérifier si l'utilisateur est connecté
      if (!req.user) {
        return res.status(401).json({ message: 'Accès non autorisé' });
      }

      // Obtenir l'ID de l'utilisateur propriétaire de la ressource
      const resourceUserId = await getResourceUserId(req);

      // Vérifier si l'utilisateur est le propriétaire ou un admin
      if (req.user.id === resourceUserId || req.user.role === 'admin') {
        next();
      } else {
        res.status(403).json({ message: 'Accès non autorisé' });
      }
    } catch (error) {
      logger.error('Erreur dans le middleware isOwnerOrAdmin:', error);
      next(error);
    }
  };
};

/**
 * Alias pour protect (compatibilité avec différents styles de code)
 */
exports.authenticate = exports.protect;

/**
 * Middleware pour restreindre l'accès basé sur le rôle
 * @param {...string} roles - Rôles autorisés (ex: 'admin', 'premium', 'user')
 */
exports.requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise',
      });
    }

    if (!roles.includes(req.user.role)) {
      logger.warn('Access denied - insufficient role:', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
      });

      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes',
        requiredRoles: roles,
      });
    }

    next();
  };
};