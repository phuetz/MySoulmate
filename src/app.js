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

// Routes versionnées
const v1Routes = require('./routes/v1');
const versionedRoutes = require('./routes/versionedRoutes');
const healthRoutes = require('./routes/healthRoutes');

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

// Middleware de base
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(ipFilter);

// Logging des requêtes HTTP
app.use(morgan('dev', {
  stream: {
    write: (message) => logger.http(message.trim())
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite chaque IP à 100 requêtes par windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Trop de requêtes, veuillez réessayer plus tard'
});
app.use(limiter);

// Documentation Swagger
const { swaggerUi, specs } = swaggerSetup;
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }));

// Route de base
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Bienvenue sur l\'API RESTful',
    documentation: '/api-docs',
    apiVersion: 'v1',
    apiBaseUrl: '/api/v1'
  });
});

// Health check routes (avant les autres routes pour éviter le rate limiting)
app.use('/health', healthRoutes);

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
