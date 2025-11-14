const Sentry = require('@sentry/node');
const { ProfilingIntegration } = require('@sentry/profiling-node');

/**
 * Configuration Sentry pour le suivi des erreurs et la performance
 */

let sentryInitialized = false;

/**
 * Initialise Sentry
 */
const initSentry = (app) => {
  // Ne pas initialiser si DSN non fourni (développement)
  if (!process.env.SENTRY_DSN) {
    console.log('⚠️  Sentry DSN not configured - error tracking disabled');
    return;
  }

  try {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',

      // Release tracking pour associer les erreurs aux versions
      release: process.env.APP_VERSION || '1.0.0',

      // Taux d'échantillonnage des transactions (0.0 à 1.0)
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),

      // Profiling pour analyse de performance
      profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'),

      integrations: [
        // Tracing automatique HTTP
        new Sentry.Integrations.Http({ tracing: true }),

        // Express integration
        new Sentry.Integrations.Express({ app }),

        // Profiling
        new ProfilingIntegration(),
      ],

      // Ignorer certaines erreurs
      ignoreErrors: [
        // Erreurs réseau communes non critiques
        'NetworkError',
        'Network request failed',

        // Erreurs d'annulation de requête
        'AbortError',
        'Request aborted',

        // Tentatives de spam/bots
        'Invalid token',
        'Token expired',
      ],

      // Avant d'envoyer l'événement, filtrer les données sensibles
      beforeSend(event, hint) {
        // Ne pas envoyer en développement
        if (process.env.NODE_ENV === 'development' && process.env.SENTRY_SEND_IN_DEV !== 'true') {
          return null;
        }

        // Nettoyer les données sensibles
        if (event.request) {
          // Supprimer les headers sensibles
          if (event.request.headers) {
            delete event.request.headers['authorization'];
            delete event.request.headers['cookie'];
            delete event.request.headers['x-csrf-token'];
          }

          // Supprimer les données de body sensibles
          if (event.request.data) {
            if (typeof event.request.data === 'object') {
              delete event.request.data.password;
              delete event.request.data.token;
              delete event.request.data.secret;
              delete event.request.data.creditCard;
            }
          }
        }

        // Ajouter des tags personnalisés
        event.tags = {
          ...event.tags,
          node_version: process.version,
        };

        return event;
      },

      // Breadcrumbs pour le contexte
      beforeBreadcrumb(breadcrumb, hint) {
        // Filtrer les breadcrumbs de console.log en production
        if (breadcrumb.category === 'console' && process.env.NODE_ENV === 'production') {
          return null;
        }
        return breadcrumb;
      },
    });

    sentryInitialized = true;
    console.log('✅ Sentry initialized for error tracking');
  } catch (error) {
    console.error('❌ Failed to initialize Sentry:', error.message);
  }
};

/**
 * Middleware de requête Sentry (à placer au début)
 */
const requestHandler = () => {
  if (!sentryInitialized) {
    return (req, res, next) => next();
  }
  return Sentry.Handlers.requestHandler({
    user: ['id', 'email', 'name'],
    ip: true,
    request: true,
  });
};

/**
 * Middleware de tracing (après requestHandler)
 */
const tracingHandler = () => {
  if (!sentryInitialized) {
    return (req, res, next) => next();
  }
  return Sentry.Handlers.tracingHandler();
};

/**
 * Middleware de gestion des erreurs (à placer à la fin)
 */
const errorHandler = () => {
  if (!sentryInitialized) {
    return (err, req, res, next) => next(err);
  }
  return Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Capturer toutes les erreurs 4xx et 5xx
      if (error.status >= 400) {
        return true;
      }
      return false;
    },
  });
};

/**
 * Capture une exception manuellement
 */
const captureException = (error, context = {}) => {
  if (!sentryInitialized) {
    console.error('Sentry not initialized, error:', error);
    return;
  }

  Sentry.captureException(error, {
    contexts: context,
  });
};

/**
 * Capture un message
 */
const captureMessage = (message, level = 'info', context = {}) => {
  if (!sentryInitialized) {
    console.log(`[${level}] ${message}`, context);
    return;
  }

  Sentry.captureMessage(message, {
    level,
    contexts: context,
  });
};

/**
 * Définit le contexte utilisateur
 */
const setUser = (user) => {
  if (!sentryInitialized) return;

  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.name,
  });
};

/**
 * Efface le contexte utilisateur (logout)
 */
const clearUser = () => {
  if (!sentryInitialized) return;
  Sentry.setUser(null);
};

/**
 * Ajoute des tags personnalisés
 */
const setTag = (key, value) => {
  if (!sentryInitialized) return;
  Sentry.setTag(key, value);
};

/**
 * Ajoute un contexte personnalisé
 */
const setContext = (name, context) => {
  if (!sentryInitialized) return;
  Sentry.setContext(name, context);
};

/**
 * Démarre une transaction pour le suivi de performance
 */
const startTransaction = (name, op = 'http.server') => {
  if (!sentryInitialized) return null;

  return Sentry.startTransaction({
    name,
    op,
  });
};

/**
 * Capture une performance metric
 */
const addBreadcrumb = (breadcrumb) => {
  if (!sentryInitialized) return;

  Sentry.addBreadcrumb({
    message: breadcrumb.message,
    category: breadcrumb.category || 'custom',
    level: breadcrumb.level || 'info',
    data: breadcrumb.data || {},
  });
};

/**
 * Middleware personnalisé pour enrichir le contexte Sentry
 */
const enrichSentryContext = (req, res, next) => {
  if (!sentryInitialized) {
    return next();
  }

  // Ajouter l'utilisateur si authentifié
  if (req.user) {
    setUser(req.user);
  }

  // Ajouter des tags utiles
  setTag('route', req.route?.path || req.path);
  setTag('method', req.method);

  if (req.user?.role) {
    setTag('user_role', req.user.role);
  }

  // Ajouter des breadcrumbs pour les actions importantes
  if (req.method !== 'GET') {
    addBreadcrumb({
      message: `${req.method} ${req.path}`,
      category: 'request',
      level: 'info',
      data: {
        method: req.method,
        url: req.url,
        userId: req.user?.id,
      },
    });
  }

  next();
};

/**
 * Wrapper pour capturer les erreurs asynchrones
 */
const wrapAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      captureException(error, {
        route: req.route?.path,
        method: req.method,
        userId: req.user?.id,
      });
      next(error);
    });
  };
};

module.exports = {
  initSentry,
  requestHandler,
  tracingHandler,
  errorHandler,
  captureException,
  captureMessage,
  setUser,
  clearUser,
  setTag,
  setContext,
  startTransaction,
  addBreadcrumb,
  enrichSentryContext,
  wrapAsync,
  Sentry, // Export direct pour fonctionnalités avancées
};
