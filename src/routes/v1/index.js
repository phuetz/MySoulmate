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
const giftRoutes = require('../giftRoutes');
const avatarRoutes = require('../avatarRoutes');
const inventoryRoutes = require('../inventoryRoutes');
const recommendationRoutes = require('../recommendationRoutes');
const calendarRoutes = require('../calendarRoutes');
const companionRoutes = require('../companionRoutes');
const paymentRoutes = require('../paymentRoutes');
const pushRoutes = require('../pushRoutes');

// Définir les routes pour l'API v1
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/gifts', giftRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/avatars', avatarRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/calendar', calendarRoutes);
router.use('/companion', companionRoutes);
router.use('/payments', paymentRoutes);
router.use('/push', pushRoutes);

module.exports = router;
