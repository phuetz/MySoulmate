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
const GiftModel = require('./giftModel')(sequelize);
const UserGiftModel = require('./userGiftModel')(sequelize);
const SessionModel = require('./sessionModel')(sequelize);
const SubscriptionModel = require('./subscriptionModel')(sequelize);
const PushTokenModel = require('./pushTokenModel')(sequelize);
const giftSeedData = require('../seed/gifts');

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

UserModel.hasMany(SessionModel, {
  foreignKey: 'userId',
  as: 'sessions'
});
SessionModel.belongsTo(UserModel, {
  foreignKey: 'userId',
  as: 'user'
});

UserModel.hasMany(UserGiftModel, {
  foreignKey: 'userId',
  as: 'gifts'
});
UserGiftModel.belongsTo(UserModel, {
  foreignKey: 'userId',
  as: 'user'
});
GiftModel.hasMany(UserGiftModel, {
  foreignKey: 'giftId',
  as: 'users'
});
UserGiftModel.belongsTo(GiftModel, {
  foreignKey: 'giftId',
  as: 'gift'
});

UserModel.hasMany(SubscriptionModel, {
  foreignKey: 'userId',
  as: 'subscriptions'
});
SubscriptionModel.belongsTo(UserModel, {
  foreignKey: 'userId',
  as: 'user'
});

UserModel.hasMany(PushTokenModel, {
  foreignKey: 'userId',
  as: 'pushTokens'
});
PushTokenModel.belongsTo(UserModel, {
  foreignKey: 'userId',
  as: 'user'
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

    // Seed gifts if table empty
    const giftCount = await GiftModel.count();
    if (giftCount === 0) {
      await GiftModel.bulkCreate(giftSeedData);
      logger.info('Gift data seeded');
    }
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
  Category: CategoryModel,
  Gift: GiftModel,
  UserGift: UserGiftModel,
  Session: SessionModel,
  Subscription: SubscriptionModel,
  PushToken: PushTokenModel
};