const cron = require('node-cron');
const { User, Session } = require('../models');
const { uploadService } = require('./uploadService');
const { logger } = require('../config/logger');
const { Op } = require('sequelize');

/**
 * Service de tâches planifiées (cron jobs)
 * Gère les tâches de maintenance automatisées
 */

const jobs = new Map();

/**
 * Nettoie les sessions expirées
 */
const cleanupExpiredSessions = async () => {
  try {
    logger.info('Starting cleanup of expired sessions...');

    const result = await Session.destroy({
      where: {
        expiresAt: {
          [Op.lt]: new Date(),
        },
      },
    });

    logger.info(`Cleaned up ${result} expired sessions`);
    return { deleted: result };
  } catch (error) {
    logger.error('Failed to cleanup expired sessions:', error);
    throw error;
  }
};

/**
 * Nettoie les tokens de réinitialisation de mot de passe expirés
 */
const cleanupPasswordResetTokens = async () => {
  try {
    logger.info('Starting cleanup of password reset tokens...');

    const result = await User.update(
      {
        passwordResetToken: null,
        passwordResetExpires: null,
      },
      {
        where: {
          passwordResetExpires: {
            [Op.lt]: new Date(),
          },
        },
      }
    );

    logger.info(`Cleaned up password reset tokens for ${result[0]} users`);
    return { updated: result[0] };
  } catch (error) {
    logger.error('Failed to cleanup password reset tokens:', error);
    throw error;
  }
};

/**
 * Supprime définitivement les comptes marqués pour suppression (après 30 jours)
 */
const processAccountDeletions = async () => {
  try {
    logger.info('Processing account deletions...');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const usersToDelete = await User.findAll({
      where: {
        deletionRequestedAt: {
          [Op.lte]: thirtyDaysAgo,
        },
      },
    });

    let deletedCount = 0;
    for (const user of usersToDelete) {
      try {
        // Supprimer toutes les données associées
        await user.destroy();
        deletedCount++;
        logger.info(`User account deleted permanently:`, { userId: user.id });
      } catch (error) {
        logger.error(`Failed to delete user account:`, { userId: user.id, error });
      }
    }

    logger.info(`Processed ${deletedCount} account deletions`);
    return { deleted: deletedCount };
  } catch (error) {
    logger.error('Failed to process account deletions:', error);
    throw error;
  }
};

/**
 * Nettoie les fichiers temporaires
 */
const cleanupTempFiles = async () => {
  try {
    logger.info('Starting cleanup of temp files...');

    const result = await uploadService.cleanupTempFiles();

    logger.info(`Cleaned up ${result.deletedCount} temp files`);
    return result;
  } catch (error) {
    logger.error('Failed to cleanup temp files:', error);
    throw error;
  }
};

/**
 * Envoie un rapport quotidien des métriques
 */
const sendDailyMetricsReport = async () => {
  try {
    logger.info('Generating daily metrics report...');

    const stats = {
      users: {
        total: await User.count(),
        active: await User.count({ where: { isActive: true } }),
        new24h: await User.count({
          where: {
            createdAt: {
              [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
        }),
      },
      sessions: {
        active: await Session.count({
          where: {
            expiresAt: {
              [Op.gt]: new Date(),
            },
          },
        }),
      },
    };

    // Ajouter les stats de stockage
    try {
      const storageStats = await uploadService.getStorageStats();
      stats.storage = storageStats;
    } catch (error) {
      logger.warn('Could not get storage stats:', error);
    }

    logger.info('Daily metrics:', stats);

    // TODO: Envoyer par email aux admins ou à un service de monitoring
    // await emailService.sendAdminReport(stats);

    return stats;
  } catch (error) {
    logger.error('Failed to generate daily metrics report:', error);
    throw error;
  }
};

/**
 * Nettoie les utilisateurs inactifs non vérifiés (après 7 jours)
 */
const cleanupUnverifiedUsers = async () => {
  try {
    logger.info('Starting cleanup of unverified users...');

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = await User.destroy({
      where: {
        emailVerified: false,
        createdAt: {
          [Op.lte]: sevenDaysAgo,
        },
      },
    });

    logger.info(`Cleaned up ${result} unverified users`);
    return { deleted: result };
  } catch (error) {
    logger.error('Failed to cleanup unverified users:', error);
    throw error;
  }
};

/**
 * Envoie des rappels pour les abonnements expirant bientôt
 */
const sendSubscriptionReminders = async () => {
  try {
    logger.info('Sending subscription renewal reminders...');

    // TODO: Implémenter la logique de rappel d'abonnement
    // - Récupérer les abonnements expirant dans 3 jours
    // - Envoyer des emails de rappel
    // - Logger les envois

    logger.info('Subscription reminders sent');
    return { sent: 0 };
  } catch (error) {
    logger.error('Failed to send subscription reminders:', error);
    throw error;
  }
};

/**
 * Wrapper pour gérer les erreurs des jobs
 */
const safeJobRunner = (jobName, jobFunction) => {
  return async () => {
    const startTime = Date.now();
    try {
      logger.info(`[CRON] Starting job: ${jobName}`);
      const result = await jobFunction();
      const duration = Date.now() - startTime;
      logger.info(`[CRON] Job completed: ${jobName} (${duration}ms)`, result);
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`[CRON] Job failed: ${jobName} (${duration}ms)`, error);
    }
  };
};

/**
 * Initialise tous les cron jobs
 */
const initializeJobs = () => {
  logger.info('Initializing scheduled jobs...');

  // Nettoyer les sessions expirées - Toutes les heures
  jobs.set(
    'cleanupSessions',
    cron.schedule('0 * * * *', safeJobRunner('cleanupSessions', cleanupExpiredSessions), {
      scheduled: true,
      timezone: 'Europe/Paris',
    })
  );

  // Nettoyer les tokens de réinitialisation - Toutes les 6 heures
  jobs.set(
    'cleanupPasswordResetTokens',
    cron.schedule('0 */6 * * *', safeJobRunner('cleanupPasswordResetTokens', cleanupPasswordResetTokens), {
      scheduled: true,
      timezone: 'Europe/Paris',
    })
  );

  // Traiter les suppressions de compte - Tous les jours à 3h
  jobs.set(
    'processAccountDeletions',
    cron.schedule('0 3 * * *', safeJobRunner('processAccountDeletions', processAccountDeletions), {
      scheduled: true,
      timezone: 'Europe/Paris',
    })
  );

  // Nettoyer les fichiers temporaires - Tous les jours à 2h
  jobs.set(
    'cleanupTempFiles',
    cron.schedule('0 2 * * *', safeJobRunner('cleanupTempFiles', cleanupTempFiles), {
      scheduled: true,
      timezone: 'Europe/Paris',
    })
  );

  // Nettoyer les utilisateurs non vérifiés - Tous les jours à 4h
  jobs.set(
    'cleanupUnverifiedUsers',
    cron.schedule('0 4 * * *', safeJobRunner('cleanupUnverifiedUsers', cleanupUnverifiedUsers), {
      scheduled: true,
      timezone: 'Europe/Paris',
    })
  );

  // Rapport quotidien - Tous les jours à 9h
  jobs.set(
    'dailyMetricsReport',
    cron.schedule('0 9 * * *', safeJobRunner('dailyMetricsReport', sendDailyMetricsReport), {
      scheduled: true,
      timezone: 'Europe/Paris',
    })
  );

  // Rappels d'abonnement - Tous les jours à 10h
  jobs.set(
    'subscriptionReminders',
    cron.schedule('0 10 * * *', safeJobRunner('subscriptionReminders', sendSubscriptionReminders), {
      scheduled: true,
      timezone: 'Europe/Paris',
    })
  );

  logger.info(`✅ ${jobs.size} scheduled jobs initialized`);
};

/**
 * Arrête tous les jobs
 */
const stopAllJobs = () => {
  logger.info('Stopping all scheduled jobs...');
  for (const [name, job] of jobs.entries()) {
    job.stop();
    logger.info(`Stopped job: ${name}`);
  }
  jobs.clear();
};

/**
 * Arrête un job spécifique
 */
const stopJob = (jobName) => {
  const job = jobs.get(jobName);
  if (job) {
    job.stop();
    jobs.delete(jobName);
    logger.info(`Stopped job: ${jobName}`);
    return true;
  }
  return false;
};

/**
 * Démarre un job spécifique
 */
const startJob = (jobName) => {
  const job = jobs.get(jobName);
  if (job) {
    job.start();
    logger.info(`Started job: ${jobName}`);
    return true;
  }
  return false;
};

/**
 * Liste tous les jobs et leur statut
 */
const listJobs = () => {
  const jobList = [];
  for (const [name, job] of jobs.entries()) {
    jobList.push({
      name,
      running: job.getStatus() === 'running',
    });
  }
  return jobList;
};

/**
 * Exécute manuellement un job (pour tests/admin)
 */
const runJobManually = async (jobName) => {
  const jobFunctions = {
    cleanupSessions: cleanupExpiredSessions,
    cleanupPasswordResetTokens: cleanupPasswordResetTokens,
    processAccountDeletions: processAccountDeletions,
    cleanupTempFiles: cleanupTempFiles,
    cleanupUnverifiedUsers: cleanupUnverifiedUsers,
    dailyMetricsReport: sendDailyMetricsReport,
    subscriptionReminders: sendSubscriptionReminders,
  };

  const jobFunction = jobFunctions[jobName];
  if (!jobFunction) {
    throw new Error(`Job not found: ${jobName}`);
  }

  logger.info(`Manually running job: ${jobName}`);
  return await safeJobRunner(jobName, jobFunction)();
};

module.exports = {
  initializeJobs,
  stopAllJobs,
  stopJob,
  startJob,
  listJobs,
  runJobManually,
  // Export individual jobs for manual execution
  cleanupExpiredSessions,
  cleanupPasswordResetTokens,
  processAccountDeletions,
  cleanupTempFiles,
  cleanupUnverifiedUsers,
  sendDailyMetricsReport,
  sendSubscriptionReminders,
};
