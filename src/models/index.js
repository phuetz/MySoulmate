const { Sequelize } = require('sequelize');
const path = require('path');
const logger = require('../utils/logger');

// Configuration de la base de données SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../database.sqlite'), // Stockage dans un fichier
  logging: (msg) => logger.debug(msg)
});

// Importation des modèles
const UserModel = require('./userModel')(sequelize);
const ProductModel = require('./productModel')(sequelize);
const CategoryModel = require('./categoryModel')(sequelize);

// Définition des associations
UserModel.hasMany(ProductModel, { 
  foreignKey: 'userId',
  as: 'products'
});
ProductModel.belongsTo(UserModel, { 
  foreignKey: 'userId',
  as: 'owner'
});

CategoryModel.hasMany(ProductModel, { 
  foreignKey: 'categoryId',
  as: 'products'
});
ProductModel.belongsTo(CategoryModel, { 
  foreignKey: 'categoryId',
  as: 'category'
});

// Fonction pour tester la connexion à la base de données
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Connexion à la base de données SQLite établie avec succès.');
    return true;
  } catch (error) {
    logger.error(`Erreur lors de la connexion à la base de données: ${error.message}`);
    return false;
  }
};

// Initialisation de la base de données
const initializeDatabase = async () => {
  try {
    // Synchronisation des modèles avec la base de données
    await sequelize.sync({ alter: true });
    logger.info('Base de données synchronisée.');
    return true;
  } catch (error) {
    logger.error(`Erreur lors de l'initialisation de la base de données: ${error.message}`);
    return false;
  }
};

module.exports = {
  sequelize,
  testConnection,
  initializeDatabase,
  Sequelize,
  User: UserModel,
  Product: ProductModel,
  Category: CategoryModel
};