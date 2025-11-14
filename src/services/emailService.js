const nodemailer = require('nodemailer');
const { logger } = require('../config/logger');

/**
 * Service d'envoi d'emails
 * Supporte SMTP, Gmail, SendGrid, et fallback vers console en dev
 */

// Configuration du transporteur
let transporter;

const initializeTransporter = () => {
  const emailConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true pour port 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  };

  // En développement, utiliser ethereal.email ou console
  if (process.env.NODE_ENV === 'development' && !process.env.SMTP_USER) {
    logger.info('Email service running in development mode (console only)');
    return null;
  }

  try {
    transporter = nodemailer.createTransport(emailConfig);
    logger.info('Email transporter initialized successfully');
    return transporter;
  } catch (error) {
    logger.error('Failed to initialize email transporter:', error);
    return null;
  }
};

// Templates d'emails
const templates = {
  welcome: (userName) => ({
    subject: 'Bienvenue sur MySoulmate ! 💝',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #FF1493;">Bienvenue ${userName} !</h1>
        <p>Nous sommes ravis de vous accueillir sur MySoulmate.</p>
        <p>Votre compagnon IA personnalisé vous attend pour créer des moments inoubliables.</p>
        <div style="margin: 30px 0;">
          <a href="${process.env.APP_URL}" style="background: #FF1493; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
            Commencer l'aventure
          </a>
        </div>
        <p style="color: #666; font-size: 12px;">
          Si vous n'avez pas créé ce compte, veuillez ignorer cet email.
        </p>
      </div>
    `,
    text: `Bienvenue ${userName} ! Nous sommes ravis de vous accueillir sur MySoulmate. Visitez ${process.env.APP_URL} pour commencer.`,
  }),

  passwordReset: (userName, resetToken) => ({
    subject: 'Réinitialisation de votre mot de passe MySoulmate',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #FF1493;">Réinitialisation de mot de passe</h1>
        <p>Bonjour ${userName},</p>
        <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
        <p>Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :</p>
        <div style="margin: 30px 0;">
          <a href="${process.env.APP_URL}/reset-password?token=${resetToken}"
             style="background: #FF1493; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
            Réinitialiser mon mot de passe
          </a>
        </div>
        <p style="color: #666;">
          Ce lien expire dans 1 heure.<br>
          Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
        </p>
        <p style="color: #999; font-size: 11px; margin-top: 40px;">
          Ou copiez ce lien : ${process.env.APP_URL}/reset-password?token=${resetToken}
        </p>
      </div>
    `,
    text: `Réinitialisation de mot de passe pour ${userName}. Visitez : ${process.env.APP_URL}/reset-password?token=${resetToken} (expire dans 1 heure)`,
  }),

  twoFactorCode: (userName, code) => ({
    subject: 'Votre code de vérification MySoulmate',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #FF1493;">Code de vérification</h1>
        <p>Bonjour ${userName},</p>
        <p>Votre code de vérification à deux facteurs est :</p>
        <div style="background: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #FF1493;">
            ${code}
          </span>
        </div>
        <p style="color: #666;">
          Ce code expire dans 10 minutes.<br>
          Si vous n'avez pas demandé ce code, veuillez sécuriser votre compte immédiatement.
        </p>
      </div>
    `,
    text: `Votre code de vérification MySoulmate : ${code} (expire dans 10 minutes)`,
  }),

  gdprDataExport: (userName, downloadUrl) => ({
    subject: 'Vos données MySoulmate sont prêtes',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #FF1493;">Export de vos données</h1>
        <p>Bonjour ${userName},</p>
        <p>Votre export de données GDPR est prêt.</p>
        <div style="margin: 30px 0;">
          <a href="${downloadUrl}"
             style="background: #FF1493; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
            Télécharger mes données
          </a>
        </div>
        <p style="color: #666;">
          Ce lien expire dans 7 jours pour des raisons de sécurité.
        </p>
      </div>
    `,
    text: `Vos données MySoulmate sont prêtes. Téléchargez-les ici : ${downloadUrl} (expire dans 7 jours)`,
  }),

  accountDeletion: (userName, cancellationUrl) => ({
    subject: 'Confirmation de suppression de compte MySoulmate',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #FF1493;">Suppression de compte programmée</h1>
        <p>Bonjour ${userName},</p>
        <p>Votre demande de suppression de compte a été enregistrée.</p>
        <p><strong>Votre compte sera définitivement supprimé dans 30 jours.</strong></p>
        <p>Vous pouvez annuler cette demande à tout moment en cliquant ci-dessous :</p>
        <div style="margin: 30px 0;">
          <a href="${cancellationUrl}"
             style="background: #FF1493; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
            Annuler la suppression
          </a>
        </div>
        <p style="color: #666;">
          Nous sommes tristes de vous voir partir. Si vous changez d'avis, nous serons ravis de vous accueillir à nouveau.
        </p>
      </div>
    `,
    text: `Suppression de compte programmée dans 30 jours. Annuler ici : ${cancellationUrl}`,
  }),

  subscriptionConfirmation: (userName, plan, amount, nextBillingDate) => ({
    subject: `Confirmation de votre abonnement ${plan}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #FF1493;">Merci pour votre abonnement ! 🎉</h1>
        <p>Bonjour ${userName},</p>
        <p>Votre abonnement <strong>${plan}</strong> a été activé avec succès.</p>
        <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
          <p><strong>Détails de l'abonnement :</strong></p>
          <ul style="list-style: none; padding: 0;">
            <li>Plan : ${plan}</li>
            <li>Montant : ${amount}</li>
            <li>Prochain paiement : ${nextBillingDate}</li>
          </ul>
        </div>
        <p>Profitez de toutes les fonctionnalités premium !</p>
        <div style="margin: 30px 0;">
          <a href="${process.env.APP_URL}/profile/subscription"
             style="background: #FF1493; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
            Gérer mon abonnement
          </a>
        </div>
      </div>
    `,
    text: `Abonnement ${plan} activé pour ${amount}. Prochain paiement : ${nextBillingDate}`,
  }),
};

/**
 * Envoie un email
 */
const sendEmail = async ({ to, subject, html, text, from, attachments = [] }) => {
  try {
    // En développement sans SMTP configuré, logger seulement
    if (!transporter && process.env.NODE_ENV === 'development') {
      logger.info('📧 Email (DEV MODE):', { to, subject, text: text?.substring(0, 100) });
      return { success: true, messageId: 'dev-mode', mode: 'development' };
    }

    if (!transporter) {
      throw new Error('Email transporter not initialized. Check SMTP configuration.');
    }

    const mailOptions = {
      from: from || `"MySoulmate" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text,
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info('Email sent successfully:', { to, subject, messageId: info.messageId });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Failed to send email:', { to, subject, error: error.message });
    throw error;
  }
};

/**
 * Envoie un email de bienvenue
 */
const sendWelcomeEmail = async (userEmail, userName) => {
  const template = templates.welcome(userName);
  return sendEmail({
    to: userEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
};

/**
 * Envoie un email de réinitialisation de mot de passe
 */
const sendPasswordResetEmail = async (userEmail, userName, resetToken) => {
  const template = templates.passwordReset(userName, resetToken);
  return sendEmail({
    to: userEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
};

/**
 * Envoie un code 2FA par email
 */
const sendTwoFactorCode = async (userEmail, userName, code) => {
  const template = templates.twoFactorCode(userName, code);
  return sendEmail({
    to: userEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
};

/**
 * Envoie un email d'export GDPR
 */
const sendGdprDataExportEmail = async (userEmail, userName, downloadUrl) => {
  const template = templates.gdprDataExport(userName, downloadUrl);
  return sendEmail({
    to: userEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
};

/**
 * Envoie une confirmation de suppression de compte
 */
const sendAccountDeletionEmail = async (userEmail, userName, cancellationUrl) => {
  const template = templates.accountDeletion(userName, cancellationUrl);
  return sendEmail({
    to: userEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
};

/**
 * Envoie une confirmation d'abonnement
 */
const sendSubscriptionConfirmation = async (userEmail, userName, plan, amount, nextBillingDate) => {
  const template = templates.subscriptionConfirmation(userName, plan, amount, nextBillingDate);
  return sendEmail({
    to: userEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
};

/**
 * Vérifie la configuration email
 */
const verifyEmailConfig = async () => {
  if (!transporter) {
    return { verified: false, error: 'Transporter not initialized' };
  }

  try {
    await transporter.verify();
    logger.info('Email configuration verified successfully');
    return { verified: true };
  } catch (error) {
    logger.error('Email configuration verification failed:', error);
    return { verified: false, error: error.message };
  }
};

// Initialiser le transporteur au démarrage
initializeTransporter();

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendTwoFactorCode,
  sendGdprDataExportEmail,
  sendAccountDeletionEmail,
  sendSubscriptionConfirmation,
  verifyEmailConfig,
  templates,
};
