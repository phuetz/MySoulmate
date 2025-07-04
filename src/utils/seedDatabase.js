const bcrypt = require('bcryptjs');
const { sequelize, User, Category, Product } = require('../models');
const logger = require('./logger');

const seedDatabase = async () => {
  try {
    logger.info('Début de l\'initialisation des données de test...');

    // Recréer les tables
    await sequelize.sync({ force: true });
    logger.info('Tables recréées avec succès');

    // Créer des utilisateurs de test
    const adminPassword = await bcrypt.hash('admin123', 10);
    const userPassword = await bcrypt.hash('user123', 10);

    const admin = await User.create({
      name: 'admin',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'admin'
    });

    const user = await User.create({
      name: 'user',
      email: 'user@example.com',
      password: userPassword,
      role: 'user'
    });

    logger.info('Utilisateurs créés avec succès');

    // Créer des catégories
    const electronics = await Category.create({
      name: 'Électronique',
      description: 'Produits électroniques et gadgets'
    });

    const clothing = await Category.create({
      name: 'Vêtements',
      description: 'Vêtements et accessoires de mode'
    });

    const books = await Category.create({
      name: 'Livres',
      description: 'Livres, eBooks et publications'
    });

    logger.info('Catégories créées avec succès');

    // Créer des produits
    await Product.create({
      name: 'Smartphone',
      description: 'Un smartphone haut de gamme',
      price: 699.99,
      stock: 50,
      categoryId: electronics.id,
      userId: admin.id
    });

    await Product.create({
      name: 'Laptop',
      description: 'Ordinateur portable pour professionnels',
      price: 1299.99,
      stock: 20,
      categoryId: electronics.id,
      userId: admin.id
    });

    await Product.create({
      name: 'T-shirt',
      description: 'T-shirt en coton',
      price: 19.99,
      stock: 100,
      categoryId: clothing.id,
      userId: user.id
    });

    await Product.create({
      name: 'Guide JavaScript',
      description: 'Guide complet sur JavaScript',
      price: 39.99,
      stock: 30,
      categoryId: books.id,
      userId: user.id
    });

    logger.info('Produits créés avec succès');
    logger.info('Initialisation des données de test terminée');

    return true;
  } catch (error) {
    logger.error(`Erreur lors de l'initialisation des données: ${error.message}`);
    return false;
  }
};

module.exports = seedDatabase;