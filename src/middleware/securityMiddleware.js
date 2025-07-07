/**
 * Middleware de sécurité pour l'API
 */
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');

// Configuration de base pour le CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 heures
};

// Rate limiting pour prévenir les attaques de force brute
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT || 100, // limite par IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Trop de requêtes, veuillez réessayer plus tard'
  }
});

// Rate limiter spécifique pour les routes d'authentification
const createAuthLimiter = () => rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // limite plus stricte pour les routes d'authentification
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: 'Trop de tentatives de connexion, veuillez réessayer plus tard'
  }
});

const authLimiter = (req, res, next) => {
  if (process.env.NODE_ENV === 'test') {
    return next();
  }
  return createAuthLimiter()(req, res, next);
};

// Configuration de sécurité pour l'application Express
const securityMiddleware = [
  // Protection contre les attaques XSS
  helmet(),
  // Options CORS personnalisées
  cors(corsOptions),
  // Protection contre l'injection NoSQL en retirant les caractères interdits
  mongoSanitize(),
  // Protection contre les attaques XSS en nettoyant les entrées utilisateur
  xss(),
  // Protection contre la pollution des paramètres HTTP
  hpp(),
  // Rate limiting général
  limiter
];

module.exports = {
  securityMiddleware,
  authLimiter
};