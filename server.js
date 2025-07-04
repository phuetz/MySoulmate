require('dotenv').config();
const app = require('./src/app');
const { testConnection, initializeDatabase } = require('./src/models');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 3000;

// Démarrage du serveur
const startServer = async () => {
  try {
    // Tester la connexion à la base de données
    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.warn('Le serveur démarrera mais la connexion à la base de données a échoué.');
    } else {
      // Initialiser la base de données
      await initializeDatabase();
    }

    // Démarrer le serveur
    app.listen(PORT, () => {
      logger.info(`Serveur démarré sur le port ${PORT}`);
      logger.info(`Documentation de l'API disponible sur http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    logger.error(`Erreur lors du démarrage du serveur: ${error.message}`);
    process.exit(1);
  }
};

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  logger.error(`Erreur non capturée: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  logger.error(`Promesse rejetée non gérée: ${error.message}`);
  process.exit(1);
});

// Démarrer le serveur
startServer();