const Joi = require('joi');

/**
 * Schémas de validation centralisés avec Joi
 * Garantit la cohérence de la validation à travers l'API
 */

// Schémas de base réutilisables
const schemas = {
  // UUID
  uuid: Joi.string().uuid().required(),
  optionalUuid: Joi.string().uuid().optional(),

  // Email
  email: Joi.string().email().lowercase().trim().required(),
  optionalEmail: Joi.string().email().lowercase().trim().optional(),

  // Mot de passe
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.pattern.base':
        'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial',
      'string.min': 'Le mot de passe doit contenir au moins 8 caractères',
      'string.max': 'Le mot de passe ne peut pas dépasser 128 caractères',
    }),

  // Nom
  name: Joi.string().min(2).max(50).trim().required(),
  optionalName: Joi.string().min(2).max(50).trim().optional(),

  // Téléphone
  phone: Joi.string()
    .pattern(/^[\d\s\-\+\(\)]+$/)
    .min(10)
    .max(20)
    .optional(),

  // URL
  url: Joi.string().uri().optional(),

  // Dates
  date: Joi.date().iso().required(),
  optionalDate: Joi.date().iso().optional(),
  dateInFuture: Joi.date().iso().greater('now').required(),
  dateInPast: Joi.date().iso().less('now').required(),

  // Pagination
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0),

  // Tri
  sortField: Joi.string().optional(),
  sortOrder: Joi.string().valid('asc', 'desc', 'ASC', 'DESC').default('desc'),

  // Code 2FA
  twoFactorCode: Joi.string().length(6).pattern(/^\d+$/).required().messages({
    'string.pattern.base': 'Le code doit contenir exactement 6 chiffres',
    'string.length': 'Le code doit contenir exactement 6 chiffres',
  }),

  // TOTP token
  totpToken: Joi.string().length(6).pattern(/^\d+$/).required(),

  // Backup code
  backupCode: Joi.string()
    .pattern(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/)
    .required()
    .messages({
      'string.pattern.base': 'Format de code de récupération invalide (XXXX-XXXX)',
    }),

  // Montant (en centimes)
  amount: Joi.number().integer().min(0).required(),

  // Devise
  currency: Joi.string().length(3).uppercase().default('EUR'),

  // Langue
  language: Joi.string().valid('fr', 'en', 'es', 'de').default('fr'),

  // Rôle utilisateur
  role: Joi.string().valid('user', 'admin').default('user'),

  // Catégorie de cadeau
  giftCategory: Joi.string().valid('virtual', 'physical', 'experience').required(),

  // Statut
  status: Joi.string().valid('active', 'inactive', 'pending', 'cancelled').default('active'),

  // Image/Fichier
  image: Joi.object({
    mimetype: Joi.string().valid('image/jpeg', 'image/png', 'image/gif', 'image/webp').required(),
    size: Joi.number().max(10 * 1024 * 1024).required(), // 10MB max
  }).unknown(true).optional(),
};

// Schémas complets pour les différentes routes

/**
 * Authentification
 */
const auth = {
  register: Joi.object({
    name: schemas.name,
    email: schemas.email,
    password: schemas.password,
  }),

  login: Joi.object({
    email: schemas.email,
    password: Joi.string().required(), // Pas de validation stricte pour le login
  }),

  verify2FA: Joi.object({
    code: schemas.twoFactorCode,
  }),

  updateProfile: Joi.object({
    name: schemas.optionalName,
    email: schemas.optionalEmail,
    phone: schemas.phone,
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: schemas.password,
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
      'any.only': 'Les mots de passe ne correspondent pas',
    }),
  }),
};

/**
 * Réinitialisation de mot de passe
 */
const passwordReset = {
  request: Joi.object({
    email: schemas.email,
  }),

  verify: Joi.object({
    token: Joi.string().required(),
  }),

  reset: Joi.object({
    token: Joi.string().required(),
    newPassword: schemas.password,
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
      'any.only': 'Les mots de passe ne correspondent pas',
    }),
  }),
};

/**
 * Two-Factor Authentication
 */
const twoFactor = {
  verifyTOTP: Joi.object({
    token: schemas.totpToken,
  }),

  verifyEmail: Joi.object({
    code: schemas.twoFactorCode,
  }),

  disable: Joi.object({
    password: Joi.string().required(),
  }),

  regenerateBackupCodes: Joi.object({
    password: Joi.string().required(),
  }),

  useBackupCode: Joi.object({
    code: schemas.backupCode,
  }),
};

/**
 * Utilisateurs
 */
const user = {
  update: Joi.object({
    name: schemas.optionalName,
    email: schemas.optionalEmail,
    phone: schemas.phone,
  }),

  updateRole: Joi.object({
    role: schemas.role,
  }),

  search: Joi.object({
    q: Joi.string().min(2).optional(),
    role: Joi.string().valid('user', 'admin').optional(),
    isActive: Joi.boolean().optional(),
    page: schemas.page,
    limit: schemas.limit,
  }),
};

/**
 * Compagnons
 */
const companion = {
  create: Joi.object({
    name: schemas.name,
    personality: Joi.string().min(10).max(500).required(),
    appearance: Joi.object({
      hairColor: Joi.string().optional(),
      eyeColor: Joi.string().optional(),
      height: Joi.number().min(100).max(250).optional(),
      bodyType: Joi.string().optional(),
    }).optional(),
    interests: Joi.array().items(Joi.string()).max(10).optional(),
  }),

  update: Joi.object({
    name: schemas.optionalName,
    personality: Joi.string().min(10).max(500).optional(),
    appearance: Joi.object({
      hairColor: Joi.string().optional(),
      eyeColor: Joi.string().optional(),
      height: Joi.number().min(100).max(250).optional(),
      bodyType: Joi.string().optional(),
    }).optional(),
    interests: Joi.array().items(Joi.string()).max(10).optional(),
  }),

  message: Joi.object({
    message: Joi.string().min(1).max(2000).required(),
    context: Joi.object().optional(),
  }),
};

/**
 * Cadeaux
 */
const gift = {
  create: Joi.object({
    name: schemas.name,
    description: Joi.string().min(10).max(1000).required(),
    price: schemas.amount,
    currency: schemas.currency,
    category: schemas.giftCategory,
    stock: Joi.number().integer().min(0).optional(),
    isAvailable: Joi.boolean().default(true),
  }),

  update: Joi.object({
    name: schemas.optionalName,
    description: Joi.string().min(10).max(1000).optional(),
    price: schemas.amount.optional(),
    currency: schemas.currency,
    category: schemas.giftCategory.optional(),
    stock: Joi.number().integer().min(0).optional(),
    isAvailable: Joi.boolean().optional(),
  }),

  purchase: Joi.object({
    giftId: schemas.uuid,
    quantity: Joi.number().integer().min(1).max(100).default(1),
    recipientMessage: Joi.string().max(500).optional(),
  }),
};

/**
 * Calendrier
 */
const calendar = {
  createEvent: Joi.object({
    title: Joi.string().min(3).max(100).required(),
    description: Joi.string().max(500).optional(),
    startDate: schemas.date,
    endDate: Joi.date().iso().greater(Joi.ref('startDate')).optional(),
    isAllDay: Joi.boolean().default(false),
    reminder: Joi.number().integer().min(0).optional(), // minutes avant
  }),

  updateEvent: Joi.object({
    title: Joi.string().min(3).max(100).optional(),
    description: Joi.string().max(500).optional(),
    startDate: schemas.optionalDate,
    endDate: schemas.optionalDate,
    isAllDay: Joi.boolean().optional(),
    reminder: Joi.number().integer().min(0).optional(),
  }),
};

/**
 * Paiements
 */
const payment = {
  createCheckoutSession: Joi.object({
    priceId: Joi.string().required(),
    successUrl: schemas.url,
    cancelUrl: schemas.url,
  }),

  createSubscription: Joi.object({
    planId: Joi.string().valid('basic', 'premium', 'ultimate').required(),
    paymentMethodId: Joi.string().optional(),
  }),
};

/**
 * GDPR
 */
const gdpr = {
  exportData: Joi.object({
    format: Joi.string().valid('json', 'zip').default('json'),
  }),

  requestDeletion: Joi.object({
    reason: Joi.string().min(10).max(500).required(),
    password: Joi.string().required(),
  }),

  rectification: Joi.object({
    field: Joi.string().required(),
    currentValue: Joi.string().required(),
    newValue: Joi.string().required(),
    reason: Joi.string().min(10).max(500).required(),
  }),
};

/**
 * Middleware de validation
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors,
      });
    }

    // Remplacer les données validées
    req[property] = value;
    next();
  };
};

/**
 * Middleware de validation pour query parameters
 */
const validateQuery = (schema) => validate(schema, 'query');

/**
 * Middleware de validation pour params
 */
const validateParams = (schema) => validate(schema, 'params');

module.exports = {
  schemas,
  auth,
  passwordReset,
  twoFactor,
  user,
  companion,
  gift,
  calendar,
  payment,
  gdpr,
  validate,
  validateQuery,
  validateParams,
};
