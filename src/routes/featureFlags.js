/**
 * Feature Flags Routes
 * Admin endpoints for managing feature flags
 */

const express = require('express');
const router = express.Router();
const featureFlagsService = require('../services/featureFlags');
const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRole } = require('../middleware/roleMiddleware');

/**
 * @route   GET /api/v1/feature-flags
 * @desc    Get all feature flags (admin only)
 * @access  Admin
 */
router.get('/', authenticate, authorizeRole('admin'), (req, res) => {
  try {
    const flags = featureFlagsService.getAll();
    res.json({ flags });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch feature flags' });
  }
});

/**
 * @route   GET /api/v1/feature-flags/me
 * @desc    Get feature flags for current user
 * @access  Private
 */
router.get('/me', authenticate, (req, res) => {
  try {
    const flags = featureFlagsService.getUserFlags(req.user.id, req.user.role);
    res.json({ flags });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user feature flags' });
  }
});

/**
 * @route   POST /api/v1/feature-flags
 * @desc    Create a new feature flag
 * @access  Admin
 */
router.post('/', authenticate, authorizeRole('admin'), async (req, res) => {
  try {
    const { key, description, enabled } = req.body;

    if (!key) {
      return res.status(400).json({ error: 'Feature key is required' });
    }

    await featureFlagsService.create(key, description, enabled);

    res.status(201).json({
      success: true,
      message: 'Feature flag created successfully'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create feature flag' });
  }
});

/**
 * @route   PUT /api/v1/feature-flags/:key/enable
 * @desc    Enable a feature flag
 * @access  Admin
 */
router.put('/:key/enable', authenticate, authorizeRole('admin'), async (req, res) => {
  try {
    await featureFlagsService.enable(req.params.key);
    res.json({ success: true, message: 'Feature flag enabled' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to enable feature flag' });
  }
});

/**
 * @route   PUT /api/v1/feature-flags/:key/disable
 * @desc    Disable a feature flag
 * @access  Admin
 */
router.put('/:key/disable', authenticate, authorizeRole('admin'), async (req, res) => {
  try {
    await featureFlagsService.disable(req.params.key);
    res.json({ success: true, message: 'Feature flag disabled' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to disable feature flag' });
  }
});

/**
 * @route   PUT /api/v1/feature-flags/:key/rollout
 * @desc    Set rollout percentage for a feature
 * @access  Admin
 */
router.put('/:key/rollout', authenticate, authorizeRole('admin'), async (req, res) => {
  try {
    const { percentage } = req.body;

    if (percentage === undefined || percentage < 0 || percentage > 100) {
      return res.status(400).json({ error: 'Percentage must be between 0 and 100' });
    }

    await featureFlagsService.setRollout(req.params.key, percentage);
    res.json({ success: true, message: 'Rollout percentage updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update rollout percentage' });
  }
});

/**
 * @route   POST /api/v1/feature-flags/:key/users
 * @desc    Add user to allowed list
 * @access  Admin
 */
router.post('/:key/users', authenticate, authorizeRole('admin'), async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    await featureFlagsService.addAllowedUser(req.params.key, userId);
    res.json({ success: true, message: 'User added to feature flag' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add user to feature flag' });
  }
});

/**
 * @route   POST /api/v1/feature-flags/reload
 * @desc    Reload feature flags from database
 * @access  Admin
 */
router.post('/reload', authenticate, authorizeRole('admin'), async (req, res) => {
  try {
    await featureFlagsService.reload();
    res.json({ success: true, message: 'Feature flags reloaded' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reload feature flags' });
  }
});

/**
 * @route   GET /api/v1/feature-flags/:key/check
 * @desc    Check if feature is enabled for current user
 * @access  Private
 */
router.get('/:key/check', authenticate, (req, res) => {
  try {
    const enabled = featureFlagsService.isEnabled(
      req.params.key,
      req.user.id,
      req.user.role
    );

    res.json({
      feature: req.params.key,
      enabled
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check feature flag' });
  }
});

module.exports = router;
