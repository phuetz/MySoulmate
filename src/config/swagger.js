/**
 * Swagger/OpenAPI Configuration
 * API documentation setup
 */

const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MySoulmate API',
      version: process.env.APP_VERSION || '2.0.0',
      description: 'AI Companion Application API Documentation',
      contact: {
        name: 'MySoulmate Support',
        email: process.env.SUPPORT_EMAIL || 'support@mysoulmate.app'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: process.env.API_STAGING_URL || 'https://staging-api.mysoulmate.app',
        description: 'Staging server'
      },
      {
        url: process.env.API_PRODUCTION_URL || 'https://api.mysoulmate.app',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from /api/v1/auth/login'
        },
        apiKey: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
          description: 'API key for server-to-server communication'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            },
            code: {
              type: 'string',
              description: 'Error code'
            },
            details: {
              type: 'object',
              description: 'Additional error details'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'User ID'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            username: {
              type: 'string',
              description: 'Username'
            },
            role: {
              type: 'string',
              enum: ['user', 'premium', 'admin'],
              description: 'User role'
            },
            twoFactorEnabled: {
              type: 'boolean',
              description: 'Whether 2FA is enabled'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation date'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update date'
            }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              description: 'JWT authentication token'
            },
            user: {
              $ref: '#/components/schemas/User'
            },
            expiresIn: {
              type: 'string',
              description: 'Token expiration time'
            }
          }
        },
        Companion: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Companion ID'
            },
            userId: {
              type: 'integer',
              description: 'Owner user ID'
            },
            name: {
              type: 'string',
              description: 'Companion name'
            },
            personality: {
              type: 'object',
              description: 'Personality traits and characteristics'
            },
            appearance: {
              type: 'object',
              description: 'Visual appearance settings'
            },
            voiceSettings: {
              type: 'object',
              description: 'Voice configuration'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Message: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Message ID'
            },
            conversationId: {
              type: 'integer',
              description: 'Conversation ID'
            },
            role: {
              type: 'string',
              enum: ['user', 'assistant'],
              description: 'Message sender role'
            },
            content: {
              type: 'string',
              description: 'Message content'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Message timestamp'
            },
            metadata: {
              type: 'object',
              description: 'Additional metadata'
            }
          }
        },
        Subscription: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Subscription ID'
            },
            userId: {
              type: 'integer',
              description: 'User ID'
            },
            tier: {
              type: 'string',
              enum: ['free', 'premium', 'elite'],
              description: 'Subscription tier'
            },
            status: {
              type: 'string',
              enum: ['active', 'cancelled', 'expired'],
              description: 'Subscription status'
            },
            startDate: {
              type: 'string',
              format: 'date-time',
              description: 'Subscription start date'
            },
            endDate: {
              type: 'string',
              format: 'date-time',
              description: 'Subscription end date'
            },
            autoRenew: {
              type: 'boolean',
              description: 'Auto-renewal status'
            }
          }
        },
        Product: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Product ID'
            },
            name: {
              type: 'string',
              description: 'Product name'
            },
            description: {
              type: 'string',
              description: 'Product description'
            },
            price: {
              type: 'number',
              format: 'float',
              description: 'Product price'
            },
            currency: {
              type: 'string',
              description: 'Currency code (USD, EUR, etc.)'
            },
            category: {
              type: 'string',
              description: 'Product category'
            },
            imageUrl: {
              type: 'string',
              format: 'uri',
              description: 'Product image URL'
            }
          }
        },
        AnalyticsEvent: {
          type: 'object',
          properties: {
            eventName: {
              type: 'string',
              description: 'Event name'
            },
            properties: {
              type: 'object',
              description: 'Event properties'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Event timestamp'
            }
          }
        },
        HealthCheck: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['healthy', 'degraded', 'unhealthy'],
              description: 'Overall health status'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Health check timestamp'
            },
            services: {
              type: 'object',
              description: 'Individual service statuses',
              additionalProperties: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    enum: ['up', 'down']
                  },
                  responseTime: {
                    type: 'number',
                    description: 'Response time in milliseconds'
                  }
                }
              }
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Authentication required',
                code: 'UNAUTHORIZED'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'User does not have permission to perform this action',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Permission denied',
                code: 'FORBIDDEN'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Resource not found',
                code: 'NOT_FOUND'
              }
            }
          }
        },
        ValidationError: {
          description: 'Request validation failed',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: {
                  email: 'Invalid email format',
                  password: 'Password must be at least 8 characters'
                }
              }
            }
          }
        },
        ServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                error: 'Internal server error',
                code: 'SERVER_ERROR'
              }
            }
          }
        }
      },
      parameters: {
        PageParam: {
          in: 'query',
          name: 'page',
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1
          },
          description: 'Page number for pagination'
        },
        LimitParam: {
          in: 'query',
          name: 'limit',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 20
          },
          description: 'Number of items per page'
        },
        LocaleParam: {
          in: 'query',
          name: 'lang',
          schema: {
            type: 'string',
            enum: ['en', 'fr', 'es', 'de', 'it', 'pt', 'ja', 'zh']
          },
          description: 'Language code for localized responses'
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints'
      },
      {
        name: 'Users',
        description: 'User management endpoints'
      },
      {
        name: 'Companions',
        description: 'AI companion management endpoints'
      },
      {
        name: 'Messages',
        description: 'Messaging and conversation endpoints'
      },
      {
        name: 'Subscriptions',
        description: 'Subscription management endpoints'
      },
      {
        name: 'Products',
        description: 'Product catalog endpoints'
      },
      {
        name: 'Gifts',
        description: 'Virtual gift endpoints'
      },
      {
        name: 'Analytics',
        description: 'Analytics and tracking endpoints'
      },
      {
        name: 'GDPR',
        description: 'GDPR compliance endpoints'
      },
      {
        name: 'Two-Factor Auth',
        description: '2FA setup and management'
      },
      {
        name: 'Internationalization',
        description: 'i18n and translation endpoints'
      },
      {
        name: 'Health',
        description: 'Health check and monitoring endpoints'
      }
    ]
  },
  apis: [
    './src/routes/*.js', // Scan all route files
    './src/controllers/*.js', // Scan all controller files
    './src/models/*.js' // Scan all model files
  ]
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

/**
 * Setup Swagger UI
 */
function setupSwagger(app) {
  // Swagger UI options
  const swaggerUiOptions = {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'MySoulmate API Documentation',
    customfavIcon: '/favicon.ico',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      syntaxHighlight: {
        theme: 'monokai'
      }
    }
  };

  // Serve Swagger UI at /api-docs
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, swaggerUiOptions));

  // Serve raw OpenAPI JSON at /api-docs.json
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerDocs);
  });

  console.log('📚 Swagger documentation available at /api-docs');
}

module.exports = {
  setupSwagger,
  swaggerDocs
};
