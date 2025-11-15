const express = require('express');
const router = express.Router();
const storyController = require('../controllers/storyController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * /api/stories:
 *   get:
 *     summary: Get all available stories
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of stories with user progress
 */
router.get('/', authenticateToken, storyController.getAllStories);

/**
 * @swagger
 * /api/stories/{storyId}:
 *   get:
 *     summary: Get a specific story with all chapters
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Story details
 */
router.get('/:storyId', authenticateToken, storyController.getStoryById);

/**
 * @swagger
 * /api/stories/{storyId}/start:
 *   post:
 *     summary: Start a new story
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Story started, returns first chapter
 */
router.post('/:storyId/start', authenticateToken, storyController.startStory);

/**
 * @swagger
 * /api/stories/{storyId}/current:
 *   get:
 *     summary: Get current chapter for a story in progress
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Current chapter
 */
router.get('/:storyId/current', authenticateToken, storyController.getCurrentChapter);

/**
 * @swagger
 * /api/stories/choice:
 *   post:
 *     summary: Make a choice and advance the story
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               storyId:
 *                 type: string
 *               chapterId:
 *                 type: string
 *               choiceId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Choice processed, returns next chapter or completion
 */
router.post('/choice', authenticateToken, storyController.makeChoice);

/**
 * @swagger
 * /api/stories/{storyId}/rate:
 *   post:
 *     summary: Rate a completed story
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storyId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *     responses:
 *       200:
 *         description: Rating saved
 */
router.post('/:storyId/rate', authenticateToken, storyController.rateStory);

/**
 * @swagger
 * /api/stories/{storyId}/stats:
 *   get:
 *     summary: Get statistics for a story
 *     tags: [Stories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Story statistics
 */
router.get('/:storyId/stats', authenticateToken, storyController.getStoryStats);

module.exports = router;
