const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const statusMonitor = require('express-status-monitor');
const client = require('prom-client');
const swaggerSetup = require('./utils/swagger');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const logger = require('./utils/logger');
const ipFilter = require('./middleware/ipFilterMiddleware');
const {
  httpsEnforcement,
  bodySizeLimiter,
  additionalSecurityHeaders,
  sanitizeRequest
} = require('./middleware/securityMiddleware');
const { RATE_LIMITS } = require('./config/constants');

// Routes versionnées
const v1Routes = require('./routes/v1');
const versionedRoutes = require('./routes/versionedRoutes');
const healthRoutes = require('./routes/health');

// Initialisation de l'application Express
const app = express();

// Monitoring Dashboard
const monitor = statusMonitor({ path: '/status' });
app.use(monitor);
// Collect default metrics for Prometheus
client.collectDefaultMetrics();

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// Security middleware (must be first)
app.use(httpsEnforcement);
app.use(additionalSecurityHeaders);
app.use(ipFilter);

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Helmet security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:']
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Compression
app.use(compression());

// Body parsing with size limits
app.use(bodySizeLimiter('10mb'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request sanitization
app.use(sanitizeRequest);

// Logging des requêtes HTTP
app.use(morgan('dev', {
  stream: {
    write: (message) => logger.http(message.trim())
  }
}));

// Rate limiting - General
const limiter = rateLimit({
  windowMs: RATE_LIMITS.GENERAL.WINDOW_MS,
  max: RATE_LIMITS.GENERAL.MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Trop de requêtes, veuillez réessayer plus tard',
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path
    });
    res.status(429).json({
      error: 'Trop de requêtes, veuillez réessayer plus tard'
    });
  }
});
app.use(limiter);

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: RATE_LIMITS.AUTH.WINDOW_MS,
  max: RATE_LIMITS.AUTH.MAX_REQUESTS,
  skipSuccessfulRequests: true,
  message: 'Trop de tentatives de connexion, réessayez plus tard'
});
app.use('/api/v1/auth', authLimiter);

// Documentation Swagger
const { swaggerUi, specs } = swaggerSetup;
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }));

// Health check routes (no auth required)
app.use('/', healthRoutes);

// Route de base
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Bienvenue sur l\'API MySoulmate',
    documentation: '/api-docs',
    health: '/health',
    status: '/status',
    metrics: '/metrics',
    apiVersion: 'v1',
    apiBaseUrl: '/api/v1',
    environment: process.env.NODE_ENV
  });
});

// Routes versionnées dynamiques
app.use('/api', versionedRoutes);

// Routes spécifiques à la v1 (compatibilité directe)
app.use('/api/v1', v1Routes);

// Pour la rétrocompatibilité (optionnel) - rediriger les anciennes routes vers v1
// Cette redirection pourrait être retirée dans une future version
app.use('/api/auth', (req, res) => res.redirect(`/api/v1/auth${req.url}`));
app.use('/api/users', (req, res) => res.redirect(`/api/v1/users${req.url}`));
app.use('/api/products', (req, res) => res.redirect(`/api/v1/products${req.url}`));
app.use('/api/categories', (req, res) => res.redirect(`/api/v1/categories${req.url}`));

// Middleware pour les routes non trouvées
app.use(notFound);

// Middleware de gestion des erreurs
app.use(errorHandler);
module.exports = app;
