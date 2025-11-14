const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

/**
 * Configuration Swagger/OpenAPI pour la documentation de l'API
 */

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MySoulmate API',
      version: '1.0.0',
      description: `
        API REST pour l'application MySoulmate - Compagnon IA personnalisé avec boutique de cadeaux virtuels.

        ## Fonctionnalités principales
        - Authentification JWT avec support 2FA
        - Gestion de profils utilisateurs
        - Compagnons IA personnalisés
        - Boutique de cadeaux virtuels et réels
        - Calendrier d'événements
        - Abonnements premium avec Stripe
        - Conformité GDPR complète

        ## Sécurité
        - JWT Bearer tokens requis pour la plupart des endpoints
        - Rate limiting par utilisateur et par IP
        - CSRF protection
        - Authentification à deux facteurs (TOTP/Email)
        - Audit logging complet
      `,
      contact: {
        name: 'Support MySoulmate',
        email: 'support@mysoulmate.app',
      },
      license: {
        name: 'Propriétaire',
      },
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3000',
        description: 'Serveur de développement',
      },
      {
        url: 'https://api.mysoulmate.app',
        description: 'Serveur de production',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtenu via /api/v1/auth/login',
        },
        sessionToken: {
          type: 'apiKey',
          in: 'header',
          name: 'x-session-token',
          description: 'Token de session pour le suivi de l\'activité',
        },
        csrfToken: {
          type: 'apiKey',
          in: 'header',
          name: 'x-csrf-token',
          description: 'Token CSRF pour la protection contre les attaques CSRF',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Identifiant unique UUID',
            },
            name: {
              type: 'string',
              description: 'Nom complet de l\'utilisateur',
              minLength: 2,
              maxLength: 50,
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Adresse email unique',
            },
            role: {
              type: 'string',
              enum: ['user', 'admin'],
              description: 'Rôle de l\'utilisateur',
            },
            isActive: {
              type: 'boolean',
              description: 'Statut du compte',
            },
            twoFactorEnabled: {
              type: 'boolean',
              description: 'Authentification 2FA activée',
            },
            twoFactorMethod: {
              type: 'string',
              enum: ['totp', 'email'],
              nullable: true,
              description: 'Méthode 2FA configurée',
            },
            emailVerified: {
              type: 'boolean',
              description: 'Email vérifié',
            },
            lastLogin: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Dernière connexion',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              description: 'Message d\'erreur',
            },
            code: {
              type: 'string',
              description: 'Code d\'erreur spécifique',
            },
            errors: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Liste des erreurs de validation',
            },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              description: 'Message de succès',
            },
            data: {
              type: 'object',
              description: 'Données de la réponse',
            },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'array',
              items: {
                type: 'object',
              },
            },
            pagination: {
              type: 'object',
              properties: {
                page: {
                  type: 'integer',
                  description: 'Page actuelle',
                },
                limit: {
                  type: 'integer',
                  description: 'Nombre d\'éléments par page',
                },
                total: {
                  type: 'integer',
                  description: 'Nombre total d\'éléments',
                },
                totalPages: {
                  type: 'integer',
                  description: 'Nombre total de pages',
                },
              },
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Token JWT manquant ou invalide',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                message: 'Accès non autorisé, token manquant',
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Permissions insuffisantes',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                message: 'Permissions insuffisantes',
              },
            },
          },
        },
        NotFoundError: {
          description: 'Ressource non trouvée',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                message: 'Ressource non trouvée',
              },
            },
          },
        },
        ValidationError: {
          description: 'Erreur de validation des données',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                message: 'Erreur de validation',
                errors: ['Le champ email est requis', 'Le mot de passe doit contenir au moins 8 caractères'],
              },
            },
          },
        },
        RateLimitError: {
          description: 'Trop de requêtes',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                message: 'Trop de requêtes, veuillez réessayer plus tard',
              },
            },
          },
        },
      },
      parameters: {
        pageParam: {
          in: 'query',
          name: 'page',
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1,
          },
          description: 'Numéro de page',
        },
        limitParam: {
          in: 'query',
          name: 'limit',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 20,
          },
          description: 'Nombre d\'éléments par page',
        },
        sortParam: {
          in: 'query',
          name: 'sort',
          schema: {
            type: 'string',
          },
          description: 'Champ de tri (préfixer par - pour ordre décroissant)',
          example: '-createdAt',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'Authentification et gestion des utilisateurs',
      },
      {
        name: '2FA',
        description: 'Authentification à deux facteurs',
      },
      {
        name: 'Password Reset',
        description: 'Réinitialisation de mot de passe',
      },
      {
        name: 'Users',
        description: 'Gestion des profils utilisateurs',
      },
      {
        name: 'Companions',
        description: 'Compagnons IA personnalisés',
      },
      {
        name: 'Gifts',
        description: 'Boutique de cadeaux virtuels et réels',
      },
      {
        name: 'Calendar',
        description: 'Événements et rappels',
      },
      {
        name: 'Payments',
        description: 'Abonnements et paiements Stripe',
      },
      {
        name: 'GDPR',
        description: 'Conformité GDPR - Export et suppression de données',
      },
      {
        name: 'Health',
        description: 'Santé et monitoring de l\'API',
      },
      {
        name: 'Admin',
        description: 'Administration (réservé aux admins)',
      },
    ],
  },
  apis: [
    './src/routes/*.js',
    './src/routes/v1/*.js',
    './src/controllers/*.js',
    './src/models/*.js',
  ],
};

const specs = swaggerJsdoc(options);

/**
 * Configuration Swagger UI avec personnalisation
 */
const swaggerUiOptions = {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #FF1493; }
  `,
  customSiteTitle: 'MySoulmate API Docs',
  customfavIcon: '/favicon.ico',
};

/**
 * Middleware Swagger
 */
const setupSwagger = (app) => {
  // Documentation JSON brute
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  // Interface Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerUiOptions));

  console.log('📚 Swagger documentation available at /api-docs');
};

module.exports = {
  setupSwagger,
  specs,
};
