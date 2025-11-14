/**
 * Enhanced Email Service
 *
 * Supports multiple email providers: SendGrid, AWS SES, SMTP
 */

const logger = require('./logger');

// Email service configuration
const EMAIL_SERVICE = process.env.EMAIL_SERVICE || 'mock';
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@mysoulmate.app';
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'MySoulmate';

// Email provider
let emailProvider;

/**
 * Initialize email service based on configuration
 */
function initializeEmailService() {
  try {
    switch (EMAIL_SERVICE) {
      case 'sendgrid':
        emailProvider = require('./emailProviders/sendgrid');
        break;
      case 'mock':
      default:
        emailProvider = require('./emailProviders/mock');
        logger.info('Using mock email provider (development mode)');
    }
  } catch (error) {
    logger.warn(`Failed to load email provider, using mock: ${error.message}`);
    emailProvider = require('./emailProviders/mock');
  }
}

/**
 * Send verification email
 * @param {string} email - Recipient email
 * @param {string} token - Verification token
 */
async function sendVerificationEmail(email, token) {
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:19006'}/verify-email?token=${token}`;

  const emailData = {
    to: email,
    from: { email: EMAIL_FROM, name: EMAIL_FROM_NAME },
    subject: 'Vérifiez votre adresse email - MySoulmate',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #FF6B9D;">Bienvenue sur MySoulmate !</h1>
        <p>Merci de vous être inscrit. Veuillez cliquer sur le lien ci-dessous pour vérifier votre adresse email :</p>
        <p style="margin: 30px 0;">
          <a href="${verificationUrl}"
             style="background-color: #FF6B9D; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Vérifier mon email
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">
          Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.
        </p>
      </div>
    `,
    text: `Bienvenue sur MySoulmate ! Vérifiez votre email : ${verificationUrl}`
  };

  try {
    await emailProvider.send(emailData);
    logger.info(`Verification email sent to ${email}`);
  } catch (error) {
    logger.error(`Failed to send verification email to ${email}:`, error);
  }
}

// Initialize on module load
initializeEmailService();

module.exports = { sendVerificationEmail };
