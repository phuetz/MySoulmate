/**
 * Middleware pour l'authentification et l'autorisation
 */
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const logger = require('../utils/logger');

/**
 * Middleware de protection des routes - vérifie le token JWT
 */
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Vérifier si le token est présent dans les en-têtes
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Vérifier si le token existe
    if (!token) {
      return res.status(401).json({ message: 'Accès non autorisé, token manquant' });
    }

    try {
      // Vérifier le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Vérifier si l'utilisateur existe toujours
      const user = await User.findByPk(decoded.id);
      if (!user) {
        return res.status(401).json({ message: 'Token invalide, utilisateur non trouvé' });
      }

      // Vérifier si l'utilisateur est actif
      if (!user.isActive) {
        return res.status(401).json({ message: 'Ce compte a été désactivé' });
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