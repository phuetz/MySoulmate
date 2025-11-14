/**
 * Mock Email Provider for Development
 * Logs emails instead of sending them
 */

const logger = require('../logger');

/**
 * Mock send email (just logs)
 * @param {Object} emailData - Email data
 * @returns {Promise}
 */
async function send(emailData) {
  logger.info('📧 MOCK EMAIL (not actually sent):', {
    to: emailData.to,
    from: emailData.from,
    subject: emailData.subject,
    text: emailData.text?.substring(0, 100) + '...',
    html: emailData.html?.substring(0, 100) + '...'
  });

  // Simulate async operation
  return new Promise((resolve) => {
    setTimeout(() => {
      logger.info(`✅ Mock email "sent" to ${emailData.to}`);
      resolve();
    }, 100);
  });
}

module.exports = { send };
