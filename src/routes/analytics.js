/**
 * Analytics Routes
 * Endpoints for analytics data and admin dashboard
 */

const express = require('express');
const router = express.Router();
const analyticsService = require('../services/analytics');
const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRole } = require('../middleware/roleMiddleware');

/**
 * @route   POST /api/v1/analytics/track
 * @desc    Track a custom event from client
 * @access  Private
 */
router.post('/track', authenticate, async (req, res) => {
  try {
    const { eventName, properties } = req.body;

    if (!eventName) {
      return res.status(400).json({ error: 'Event name is required' });
    }

    await analyticsService.track(req.user.id, eventName, {
      ...properties,
      platform: req.headers['x-platform'] || 'unknown'
    });

    res.json({ success: true, message: 'Event tracked successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to track event' });
  }
});

/**
 * @route   POST /api/v1/analytics/identify
 * @desc    Identify user with properties
 * @access  Private
 */
router.post('/identify', authenticate, async (req, res) => {
  try {
    const { properties } = req.body;

    await analyticsService.identify(req.user.id, properties);

    res.json({ success: true, message: 'User identified successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to identify user' });
  }
});

/**
 * @route   GET /api/v1/analytics/user/:userId
 * @desc    Get analytics for a specific user
 * @access  Admin only
 */
router.get('/user/:userId', authenticate, authorizeRole('admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const end = endDate ? new Date(endDate) : new Date();

    const analytics = await analyticsService.getUserAnalytics(userId, start, end);

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user analytics' });
  }
});

/**
 * @route   GET /api/v1/analytics/dashboard
 * @desc    Get analytics dashboard data
 * @access  Admin only
 */
router.get('/dashboard', authenticate, authorizeRole('admin'), async (req, res) => {
  try {
    const { AnalyticsEvent } = require('../models');
    const { Op } = require('sequelize');
    const sequelize = require('../config/database');

    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    const end = endDate ? new Date(endDate) : new Date();

    // Total events
    const totalEvents = await AnalyticsEvent.count({
      where: {
        timestamp: {
          [Op.between]: [start, end]
        }
      }
    });

    // Top events
    const topEvents = await AnalyticsEvent.findAll({
      attributes: [
        'eventName',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        timestamp: {
          [Op.between]: [start, end]
        }
      },
      group: ['eventName'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit: 10,
      raw: true
    });

    // Events by day
    const eventsByDay = await AnalyticsEvent.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('timestamp')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        timestamp: {
          [Op.between]: [start, end]
        }
      },
      group: [sequelize.fn('DATE', sequelize.col('timestamp'))],
      order: [[sequelize.fn('DATE', sequelize.col('timestamp')), 'ASC']],
      raw: true
    });

    // Active users
    const activeUsers = await AnalyticsEvent.findAll({
      attributes: [
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('userId'))), 'count']
      ],
      where: {
        timestamp: {
          [Op.between]: [start, end]
        },
        userId: {
          [Op.not]: null
        }
      },
      raw: true
    });

    // Platform breakdown
    const platformBreakdown = await AnalyticsEvent.findAll({
      attributes: [
        'platform',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        timestamp: {
          [Op.between]: [start, end]
        }
      },
      group: ['platform'],
      raw: true
    });

    res.json({
      totalEvents,
      activeUsers: activeUsers[0].count,
      topEvents,
      eventsByDay,
      platformBreakdown,
      dateRange: {
        start,
        end
      }
    });
  } catch (error) {
    console.error('Analytics dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics dashboard' });
  }
});

/**
 * @route   GET /api/v1/analytics/funnel
 * @desc    Get conversion funnel data
 * @access  Admin only
 */
router.get('/funnel', authenticate, authorizeRole('admin'), async (req, res) => {
  try {
    const { AnalyticsEvent } = require('../models');
    const { Op } = require('sequelize');
    const sequelize = require('../config/database');

    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Define funnel steps
    const funnelSteps = [
      'User Signup',
      'User Login',
      'AI Interaction',
      'Subscription Started',
      'Purchase'
    ];

    const funnelData = await Promise.all(
      funnelSteps.map(async (step) => {
        const count = await AnalyticsEvent.count({
          where: {
            eventName: step,
            timestamp: {
              [Op.between]: [start, end]
            }
          },
          distinct: true,
          col: 'userId'
        });

        return { step, count };
      })
    );

    // Calculate conversion rates
    const funnelWithConversion = funnelData.map((step, index) => {
      const conversionRate = index === 0
        ? 100
        : ((step.count / funnelData[0].count) * 100).toFixed(2);

      return {
        ...step,
        conversionRate: parseFloat(conversionRate)
      };
    });

    res.json({
      funnel: funnelWithConversion,
      dateRange: {
        start,
        end
      }
    });
  } catch (error) {
    console.error('Analytics funnel error:', error);
    res.status(500).json({ error: 'Failed to fetch funnel data' });
  }
});

module.exports = router;
