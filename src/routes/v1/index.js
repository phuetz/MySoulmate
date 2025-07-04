/**
 * Regroupement des routes pour l'API v1
 */
const express = require('express');
const router = express.Router();

// Importer les routes
const authRoutes = require('../authRoutes');
const userRoutes = require('../userRoutes');
const productRoutes = require('../productRoutes');
const categoryRoutes = require('../categoryRoutes');

// Définir les routes pour l'API v1
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);

module.exports = router;