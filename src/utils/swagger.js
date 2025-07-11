/**
 * Configuration de Swagger pour la documentation de l'API
 */
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Définition des options Swagger
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API RESTful Node.js',
      version: '1.0.0',
      description: 'Documentation de l\'API RESTful avec Express.js et SQLite',
      contact: {
        name: 'Support API',
        email: 'support@api.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}/api/v1`,
        description: 'Serveur de développement - API v1',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'Opérations liées à l\'authentification',
      },
      {
        name: 'Users',
        description: 'Opérations liées aux utilisateurs',
      },
      {
        name: 'Products',
        description: 'Opérations liées aux produits',
      },
      {
        name: 'Categories',
        description: 'Opérations liées aux catégories',
      },
      {
        name: 'Recommendations',
        description: 'Contenus recommandés pour l\'utilisateur',
      },
    ],
  },
  // Chemin vers les fichiers contenant les annotations JSDoc
  apis: ['./src/routes/*.js'],
};

// Initialiser swagger-jsdoc
const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs
};