const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');

/**
 * @swagger
 * /api/recommendations:
 *   get:
 *     summary: Obtenir des recommandations personnalisees de contenus
 *     tags: [Recommendations]
 *     responses:
 *       200:
 *         description: Liste des recommandations
 */
router.get('/', recommendationController.getRecommendations);

module.exports = router;
