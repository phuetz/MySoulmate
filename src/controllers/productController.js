/**
 * Contrôleur pour la gestion des produits
 */
const { validationResult } = require('express-validator');
const { Product, Category, User, sequelize } = require('../models');
const logger = require('../utils/logger');

/**
 * @desc    Obtenir tous les produits
 * @route   GET /api/products
 * @access  Public
 */
exports.getAllProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Filtres et tri
    const { categoryId, minPrice, maxPrice, search, sortBy, sortOrder } = req.query;
    
    const whereClause = { isActive: true };
    if (categoryId) whereClause.categoryId = categoryId;
    if (minPrice) whereClause.price = { ...whereClause.price, [sequelize.Op.gte]: minPrice };
    if (maxPrice) whereClause.price = { ...whereClause.price, [sequelize.Op.lte]: maxPrice };
    if (search) whereClause.name = { [sequelize.Op.iLike]: `%${search}%` };
    
    const orderOptions = [];
    if (sortBy) {
      orderOptions.push([sortBy, sortOrder === 'desc' ? 'DESC' : 'ASC']);
    } else {
      orderOptions.push(['createdAt', 'DESC']);
    }

    const { count, rows: products } = await Product.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name']
        }
      ],
      limit,
      offset,
      order: orderOptions
    });

    res.status(200).json({
      products,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalItems: count
    });
  } catch (error) {
    logger.error('Erreur lors de la récupération des produits:', error);
    next(error);
  }
};

/**
 * @desc    Obtenir un produit par ID
 * @route   GET /api/products/:id
 * @access  Public
 */
exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'description']
        },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    // Si le produit n'est pas actif, seul le propriétaire ou un admin peut le voir
    if (!product.isActive && 
        (!req.user || (req.user.id !== product.userId && req.user.role !== 'admin'))) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    res.status(200).json(product);
  } catch (error) {
    logger.error(`Erreur lors de la récupération du produit ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * @desc    Créer un nouveau produit
 * @route   POST /api/products
 * @access  Private
 */
exports.createProduct = async (req, res, next) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, price, stock, imageUrl, categoryId } = req.body;

    // Vérifier si la catégorie existe
    if (categoryId) {
      const categoryExists = await Category.findByPk(categoryId);
      if (!categoryExists) {
        return res.status(400).json({ message: 'Catégorie non trouvée' });
      }
    }

    // Créer le produit
    const product = await Product.create({
      name,
      description,
      price,
      stock,
      imageUrl,
      categoryId,
      userId: req.user.id
    });

    // Récupérer le produit avec ses relations
    const newProduct = await Product.findByPk(product.id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name']
        }
      ]
    });

    res.status(201).json({
      message: 'Produit créé avec succès',
      product: newProduct
    });
  } catch (error) {
    logger.error('Erreur lors de la création du produit:', error);
    next(error);
  }
};

/**
 * @desc    Mettre à jour un produit
 * @route   PUT /api/products/:id
 * @access  Private
 */
exports.updateProduct = async (req, res, next) => {
  try {
    // Vérifier les erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    // Vérifier si l'utilisateur a le droit de modifier ce produit
    if (req.user.id !== product.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    const { name, description, price, stock, imageUrl, categoryId, isActive } = req.body;

    // Vérifier si la catégorie existe
    if (categoryId) {
      const categoryExists = await Category.findByPk(categoryId);
      if (!categoryExists) {
        return res.status(400).json({ message: 'Catégorie non trouvée' });
      }
    }

    // Mettre à jour le produit
    await product.update({
      name: name || product.name,
      description: description !== undefined ? description : product.description,
      price: price || product.price,
      stock: stock !== undefined ? stock : product.stock,
      imageUrl: imageUrl !== undefined ? imageUrl : product.imageUrl,
      categoryId: categoryId || product.categoryId,
      isActive: isActive !== undefined ? isActive : product.isActive
    });

    // Récupérer le produit mis à jour avec ses relations
    const updatedProduct = await Product.findByPk(product.id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name']
        }
      ]
    });

    res.status(200).json({
      message: 'Produit mis à jour avec succès',
      product: updatedProduct
    });
  } catch (error) {
    logger.error(`Erreur lors de la mise à jour du produit ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * @desc    Supprimer un produit
 * @route   DELETE /api/products/:id
 * @access  Private
 */
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }

    // Vérifier si l'utilisateur a le droit de supprimer ce produit
    if (req.user.id !== product.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    await product.destroy();

    res.status(200).json({ message: 'Produit supprimé avec succès' });
  } catch (error) {
    logger.error(`Erreur lors de la suppression du produit ${req.params.id}:`, error);
    next(error);
  }
};