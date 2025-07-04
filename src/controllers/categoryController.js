/**
 * Contrôleur pour la gestion des catégories
 */
const { validationResult } = require('express-validator');
const { Category, Product } = require('../models');
const logger = require('../utils/logger');

/**
 * @desc    Obtenir toutes les catégories
 * @route   GET /api/categories
 * @access  Public
 */
exports.getAllCategories = async (req, res, next) => {
  try {
    const categories = await Category.findAll({
      order: [['name', 'ASC']]
    });

    res.status(200).json(categories);
  } catch (error) {
    logger.error('Erreur lors de la récupération des catégories:', error);
    next(error);
  }
};

/**
 * @desc    Obtenir une catégorie par ID avec ses produits
 * @route   GET /api/categories/:id
 * @access  Public
 */
exports.getCategoryById = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id, {
      include: [
        {
          model: Product,
          as: 'products',
          where: { isActive: true },
          required: false
        }
      ]
    });

    if (!category) {
      return res.status(404).json({ message: 'Catégorie non trouvée' });
    }

    res.status(200).json(category);
  } catch (error) {
    logger.error(`Erreur lors de la récupération de la catégorie ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * @desc    Créer une nouvelle catégorie
 * @route   POST /api/categories
 * @access  Private/Admin
 */
exports.createCategory = async (req, res, next) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description } = req.body;

    // Vérifier si la catégorie existe déjà
    const categoryExists = await Category.findOne({ where: { name } });
    if (categoryExists) {
      return res.status(400).json({ message: 'Une catégorie avec ce nom existe déjà' });
    }

    // Créer la catégorie
    const category = await Category.create({
      name,
      description
    });

    res.status(201).json({
      message: 'Catégorie créée avec succès',
      category
    });
  } catch (error) {
    logger.error('Erreur lors de la création de la catégorie:', error);
    next(error);
  }
};

/**
 * @desc    Mettre à jour une catégorie
 * @route   PUT /api/categories/:id
 * @access  Private/Admin
 */
exports.updateCategory = async (req, res, next) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const category = await Category.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Catégorie non trouvée' });
    }

    const { name, description, isActive } = req.body;

    // Vérifier si le nouveau nom existe déjà
    if (name && name !== category.name) {
      const nameExists = await Category.findOne({ where: { name } });
      if (nameExists) {
        return res.status(400).json({ message: 'Une catégorie avec ce nom existe déjà' });
      }
    }

    // Mettre à jour la catégorie
    await category.update({
      name: name || category.name,
      description: description !== undefined ? description : category.description,
      isActive: isActive !== undefined ? isActive : category.isActive
    });

    res.status(200).json({
      message: 'Catégorie mise à jour avec succès',
      category
    });
  } catch (error) {
    logger.error(`Erreur lors de la mise à jour de la catégorie ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * @desc    Supprimer une catégorie
 * @route   DELETE /api/categories/:id
 * @access  Private/Admin
 */
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Catégorie non trouvée' });
    }

    // Vérifier si des produits utilisent cette catégorie
    const productsCount = await Product.count({ where: { categoryId: category.id } });
    if (productsCount > 0) {
      // Option 1: Refuser la suppression
      // return res.status(400).json({ 
      //   message: 'Impossible de supprimer cette catégorie car elle est utilisée par des produits' 
      // });
      
      // Option 2: Mettre à jour les produits pour qu'ils n'aient plus de catégorie
      await Product.update(
        { categoryId: null },
        { where: { categoryId: category.id } }
      );
    }

    await category.destroy();

    res.status(200).json({ message: 'Catégorie supprimée avec succès' });
  } catch (error) {
    logger.error(`Erreur lors de la suppression de la catégorie ${req.params.id}:`, error);
    next(error);
  }
};