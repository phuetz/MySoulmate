const express = require('express');
const router = express.Router();
const aiImageController = require('../controllers/aiImageController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * /api/ai-images/generate:
 *   post:
 *     summary: Generate AI image with multi-provider support
 *     tags: [AI Images]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               prompt:
 *                 type: string
 *               provider:
 *                 type: string
 *                 enum: [dalle3, flux, sdxl]
 *               style:
 *                 type: string
 *                 enum: [realistic, anime, artistic, professional, fantasy, romantic]
 *               quality:
 *                 type: string
 *                 enum: [standard, hd, ultra]
 *     responses:
 *       200:
 *         description: Image generated successfully
 */
router.post('/generate', authenticateToken, aiImageController.generateImage);

/**
 * @swagger
 * /api/ai-images/template:
 *   post:
 *     summary: Generate image from template
 *     tags: [AI Images]
 *     security:
 *       - bearerAuth: []
 */
router.post('/template', authenticateToken, aiImageController.generateFromTemplate);

/**
 * @swagger
 * /api/ai-images/gallery:
 *   get:
 *     summary: Get user's image gallery
 *     tags: [AI Images]
 *     security:
 *       - bearerAuth: []
 */
router.get('/gallery', authenticateToken, aiImageController.getGallery);

/**
 * @swagger
 * /api/ai-images/templates:
 *   get:
 *     summary: Get available templates
 *     tags: [AI Images]
 *     security:
 *       - bearerAuth: []
 */
router.get('/templates', authenticateToken, aiImageController.getTemplates);

/**
 * @swagger
 * /api/ai-images/cost:
 *   get:
 *     summary: Get cost estimate for generation
 *     tags: [AI Images]
 *     security:
 *       - bearerAuth: []
 */
router.get('/cost', authenticateToken, aiImageController.getCostEstimate);

/**
 * @swagger
 * /api/ai-images/public:
 *   get:
 *     summary: Get public gallery (community images)
 *     tags: [AI Images]
 *     security:
 *       - bearerAuth: []
 */
router.get('/public', authenticateToken, aiImageController.getPublicGallery);

/**
 * @swagger
 * /api/ai-images/:imageId/favorite:
 *   post:
 *     summary: Toggle favorite status
 *     tags: [AI Images]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:imageId/favorite', authenticateToken, aiImageController.toggleFavorite);

/**
 * @swagger
 * /api/ai-images/:imageId:
 *   delete:
 *     summary: Delete image
 *     tags: [AI Images]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:imageId', authenticateToken, aiImageController.deleteImage);

module.exports = router;
