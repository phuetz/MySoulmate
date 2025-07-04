/**
 * Middleware pour la gestion des erreurs
 */
const logger = require('../utils/logger');

/**
 * Gestion des erreurs 404 (routes non trouvées)
 */
exports.notFound = (req, res, next) => {
  const error = new Error(`Route non trouvée - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

/**
 * Gestion des erreurs globales
 */
exports.errorHandler = (err, req, res, next) => {
  // Déterminer le code d'état - utiliser 500 par défaut si la réponse n'a pas de statut d'erreur
  const statusCode = err.statusCode || res.statusCode === 200 ? 500 : res.statusCode;
  
  // Préparer la réponse d'erreur
  const errorResponse = {
    success: false,
    message: err.message || 'Erreur serveur',
    timestamp: new Date().toISOString()
  };

  // Ajouter des détails spécifiques selon le type d'erreur
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    errorResponse.message = 'Erreur de validation des données';
    errorResponse.errors = err.errors.map(e => ({
      field: e.path,
      message: e.message,
      value: e.value
    }));
    
    // Les erreurs de validation sont des erreurs 400
    statusCode = 400;
  } else if (err.name === 'JsonWebTokenError') {
    errorResponse.message = 'Token JWT invalide';
    // Les erreurs d'authentification sont des erreurs 401
    statusCode = 401;
  } else if (err.name === 'TokenExpiredError') {
    errorResponse.message = 'Token JWT expiré';
    // Les erreurs d'authentification sont des erreurs 401
    statusCode = 401;
  } else if (err.name === 'SequelizeDatabaseError') {
    errorResponse.message = 'Erreur de base de données';
    // Les erreurs de base de données sont masquées en production
  } else if (err.name === 'ValidationError') {
    errorResponse.message = 'Erreur de validation';
    errorResponse.errors = err.errors;
    statusCode = 400;
  }

  // Ajouter la stack trace en développement
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.stack = err.stack;
  }

  // Logger l'erreur avec le niveau approprié
  const logMessage = `${statusCode} - ${req.method} ${req.originalUrl} - ${err.message}`;
  if (statusCode >= 500) {
    logger.error(logMessage, { stack: err.stack });
  } else if (statusCode >= 400) {
    logger.warn(logMessage);
  } else {
    logger.info(logMessage);
  }

  // Envoyer la réponse d'erreur
  res.status(statusCode).json(errorResponse);
};

/**
 * Middleware de gestion des erreurs asynchrones
 * @param {Function} fn - Fonction middleware asynchrone
 * @returns {Function} Middleware avec gestion d'erreur
 */
exports.asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Middleware pour gérer les erreurs de validation express-validator
 */
exports.validationErrorHandler = (req, res, next) => {
  const { validationErrors } = req;
  
  if (validationErrors && validationErrors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation des données',
      errors: validationErrors,
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};