/**
 * Audit Logs Routes
 * Admin endpoints for viewing audit logs
 */

const express = require('express');
const router = express.Router();
const auditLogService = require('../services/auditLog');
const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRole } = require('../middleware/roleMiddleware');

/**
 * @route   GET /api/v1/audit-logs
 * @desc    Get all audit logs (admin only)
 * @access  Admin
 */
router.get('/', authenticate, authorizeRole('admin'), async (req, res) => {
  try {
    const { startDate, endDate, action, userId, status, limit, offset } = req.query;

    const logs = await auditLogService.getAllLogs({
      startDate: startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate: endDate ? new Date(endDate) : new Date(),
      action,
      userId,
      status,
      limit: parseInt(limit) || 100,
      offset: parseInt(offset) || 0
    });

    res.json({ logs, total: logs.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

/**
 * @route   GET /api/v1/audit-logs/me
 * @desc    Get audit logs for current user
 * @access  Private
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    const { startDate, endDate, action, limit, offset } = req.query;

    const logs = await auditLogService.getUserLogs(req.user.id, {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      action,
      limit: parseInt(limit) || 100,
      offset: parseInt(offset) || 0
    });

    res.json({ logs, total: logs.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user audit logs' });
  }
});

/**
 * @route   GET /api/v1/audit-logs/user/:userId
 * @desc    Get audit logs for specific user (admin only)
 * @access  Admin
 */
router.get('/user/:userId', authenticate, authorizeRole('admin'), async (req, res) => {
  try {
    const { startDate, endDate, action, limit, offset } = req.query;

    const logs = await auditLogService.getUserLogs(parseInt(req.params.userId), {
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      action,
      limit: parseInt(limit) || 100,
      offset: parseInt(offset) || 0
    });

    res.json({ logs, total: logs.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user audit logs' });
  }
});

/**
 * @route   GET /api/v1/audit-logs/resource/:resource/:resourceId
 * @desc    Get audit logs for specific resource (admin only)
 * @access  Admin
 */
router.get('/resource/:resource/:resourceId', authenticate, authorizeRole('admin'), async (req, res) => {
  try {
    const { resource, resourceId } = req.params;
    const { limit, offset } = req.query;

    const logs = await auditLogService.getResourceLogs(resource, resourceId, {
      limit: parseInt(limit) || 100,
      offset: parseInt(offset) || 0
    });

    res.json({ logs, total: logs.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch resource audit logs' });
  }
});

/**
 * @route   GET /api/v1/audit-logs/statistics
 * @desc    Get audit log statistics (admin only)
 * @access  Admin
 */
router.get('/statistics', authenticate, authorizeRole('admin'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const stats = await auditLogService.getStatistics(
      startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate ? new Date(endDate) : new Date()
    );

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit statistics' });
  }
});

module.exports = router;
