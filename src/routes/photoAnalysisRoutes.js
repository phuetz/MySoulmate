const express = require('express');
const router = express.Router();
const photoAnalysisController = require('../controllers/photoAnalysisController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * /api/photo-analysis/analyze:
 *   post:
 *     summary: Analyze photo with AI vision
 *     tags: [Photo Analysis]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               imageUrl:
 *                 type: string
 *               provider:
 *                 type: string
 *                 enum: [gpt4vision, gemini]
 *     responses:
 *       200:
 *         description: Photo analyzed successfully
 */
router.post('/analyze', authenticateToken, photoAnalysisController.analyzePhoto);

/**
 * @swagger
 * /api/photo-analysis/providers:
 *   get:
 *     summary: Get available vision AI providers
 *     tags: [Photo Analysis]
 *     security:
 *       - bearerAuth: []
 */
router.get('/providers', authenticateToken, photoAnalysisController.getProviders);

module.exports = router;
