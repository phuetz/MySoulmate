/**
 * Routes GDPR
 * Endpoints pour conformité RGPD
 */
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  exportUserData,
  requestAccountDeletion,
  cancelAccountDeletion,
  getProcessingInfo,
  requestRectification
} = require('../controllers/gdprController');

/**
 * @swagger
 * /gdpr/export:
 *   get:
 *     summary: Export all user data (GDPR Article 15)
 *     description: Download a complete copy of your personal data
 *     tags: [GDPR]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, zip]
 *         description: Export format
 *     responses:
 *       200:
 *         description: User data exported successfully
 */
router.get('/export', protect, exportUserData);

/**
 * @swagger
 * /gdpr/delete-account:
 *   delete:
 *     summary: Request account deletion (GDPR Article 17)
 *     description: Request permanent deletion of your account and all data
 *     tags: [GDPR]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - confirmation
 *             properties:
 *               confirmation:
 *                 type: string
 *                 example: "DELETE MY ACCOUNT"
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Deletion request received
 */
router.delete('/delete-account', protect, requestAccountDeletion);

/**
 * @swagger
 * /gdpr/cancel-deletion:
 *   post:
 *     summary: Cancel account deletion request
 *     tags: [GDPR]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Deletion cancelled successfully
 */
router.post('/cancel-deletion', protect, cancelAccountDeletion);

/**
 * @swagger
 * /gdpr/processing-info:
 *   get:
 *     summary: Get data processing information
 *     description: Information about how your data is processed (GDPR Article 13)
 *     tags: [GDPR]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Processing information
 */
router.get('/processing-info', protect, getProcessingInfo);

/**
 * @swagger
 * /gdpr/rectification:
 *   post:
 *     summary: Request data rectification (GDPR Article 16)
 *     description: Request correction of inaccurate personal data
 *     tags: [GDPR]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - field
 *               - requestedValue
 *             properties:
 *               field:
 *                 type: string
 *               currentValue:
 *                 type: string
 *               requestedValue:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Rectification request received
 */
router.post('/rectification', protect, requestRectification);

module.exports = router;
