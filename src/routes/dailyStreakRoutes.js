const express = require('express');
const router = express.Router();
const dailyStreakController = require('../controllers/dailyStreakController');
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * /api/streaks:
 *   get:
 *     summary: Get user's streak information
 *     tags: [Daily Streaks]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authenticateToken, dailyStreakController.getStreakInfo);

/**
 * @swagger
 * /api/streaks/checkin:
 *   post:
 *     summary: Check in for the day
 *     tags: [Daily Streaks]
 *     security:
 *       - bearerAuth: []
 */
router.post('/checkin', authenticateToken, dailyStreakController.checkIn);

/**
 * @swagger
 * /api/streaks/milestone:
 *   post:
 *     summary: Claim milestone reward
 *     tags: [Daily Streaks]
 *     security:
 *       - bearerAuth: []
 */
router.post('/milestone', authenticateToken, dailyStreakController.claimMilestone);

/**
 * @swagger
 * /api/streaks/leaderboard:
 *   get:
 *     summary: Get streak leaderboard
 *     tags: [Daily Streaks]
 *     security:
 *       - bearerAuth: []
 */
router.get('/leaderboard', authenticateToken, dailyStreakController.getLeaderboard);

module.exports = router;
