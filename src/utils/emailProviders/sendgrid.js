/**
 * SendGrid Email Provider
 */

const logger = require('../logger');

let sgMail;

try {
  sgMail = require('@sendgrid/mail');
  const apiKey = process.env.SENDGRID_API_KEY;

  if (!apiKey) {
    logger.warn('SENDGRID_API_KEY not set, email sending will fail');
  } else {
    sgMail.setApiKey(apiKey);
    logger.info('SendGrid email provider initialized');
  }
} catch (error) {
  logger.error('Failed to initialize SendGrid:', error.message);
  logger.warn('Install @sendgrid/mail: npm install @sendgrid/mail');
}

/**
 * Send email via SendGrid
 * @param {Object} emailData - Email data
 * @returns {Promise}
 */
async function send(emailData) {
  if (!sgMail) {
    throw new Error('SendGrid not initialized. Install @sendgrid/mail package.');
  }

  if (!process.env.SENDGRID_API_KEY) {
    throw new Error('SENDGRID_API_KEY not configured');
  }

  try {
    const msg = {
      to: emailData.to,
      from: emailData.from,
      subject: emailData.subject,
      text: emailData.text,
      html: emailData.html
    };

    await sgMail.send(msg);
    logger.info(`Email sent via SendGrid to ${emailData.to}`);
  } catch (error) {
    logger.error('SendGrid send error:', error);
    if (error.response) {
      logger.error('SendGrid error response:', error.response.body);
    }
    throw error;
  }
}

module.exports = { send };
