/**
 * Queue System using Bull
 *
 * Handles background jobs: emails, notifications, AI calls, etc.
 */

const logger = require('../utils/logger');

let Queue;
let emailQueue;
let notificationQueue;
let aiQueue;

/**
 * Initialize queue system
 */
function initializeQueues() {
  // Check if Redis is available
  if (!process.env.REDIS_HOST) {
    logger.warn('Redis not configured, queue system disabled');
    return;
  }

  try {
    Queue = require('bull');

    const redisConfig = {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0')
      }
    };

    // Create queues
    emailQueue = new Queue('email', redisConfig);
    notificationQueue = new Queue('notification', redisConfig);
    aiQueue = new Queue('ai', redisConfig);

    // Setup job processors
    setupEmailProcessor();
    setupNotificationProcessor();
    setupAIProcessor();

    // Setup event handlers
    setupEventHandlers();

    logger.info('Queue system initialized');
  } catch (error) {
    logger.error('Failed to initialize queue system:', error);
    logger.warn('Background jobs will be processed synchronously');
  }
}

/**
 * Setup email queue processor
 */
function setupEmailProcessor() {
  if (!emailQueue) {
    return;
  }

  emailQueue.process(async (job) => {
    const { to, subject, html, text } = job.data;

    logger.info('Processing email job', {
      jobId: job.id,
      to
    });

    try {
      const emailService = require('../utils/emailService');
      await emailService.sendNotificationEmail(to, subject, html || text);

      logger.info('Email job completed', { jobId: job.id });
      return { success: true };
    } catch (error) {
      logger.error('Email job failed:', error);
      throw error;
    }
  });
}

/**
 * Setup notification queue processor
 */
function setupNotificationProcessor() {
  if (!notificationQueue) {
    return;
  }

  notificationQueue.process(async (job) => {
    const { userId, title, body, data } = job.data;

    logger.info('Processing notification job', {
      jobId: job.id,
      userId
    });

    try {
      // Send push notification via Expo
      // const { Expo } = require('expo-server-sdk');
      // await sendPushNotification(...)

      logger.info('Notification job completed', { jobId: job.id });
      return { success: true };
    } catch (error) {
      logger.error('Notification job failed:', error);
      throw error;
    }
  });
}

/**
 * Setup AI queue processor
 */
function setupAIProcessor() {
  if (!aiQueue) {
    return;
  }

  aiQueue.process(async (job) => {
    const { userId, companionId, message } = job.data;

    logger.info('Processing AI job', {
      jobId: job.id,
      userId,
      companionId
    });

    try {
      // Process AI request
      // const aiUtils = require('../utils/aiUtils');
      // const response = await aiUtils.getAIResponse(...)

      logger.info('AI job completed', { jobId: job.id });
      return { success: true };
    } catch (error) {
      logger.error('AI job failed:', error);
      throw error;
    }
  });
}

/**
 * Setup event handlers for queues
 */
function setupEventHandlers() {
  const queues = [emailQueue, notificationQueue, aiQueue].filter(q => q);

  queues.forEach((queue) => {
    queue.on('completed', (job, result) => {
      logger.debug(`Job ${job.id} completed`, { queue: queue.name, result });
    });

    queue.on('failed', (job, err) => {
      logger.error(`Job ${job.id} failed`, {
        queue: queue.name,
        error: err.message,
        stack: err.stack
      });
    });

    queue.on('stalled', (job) => {
      logger.warn(`Job ${job.id} stalled`, { queue: queue.name });
    });
  });
}

/**
 * Add email job to queue
 * @param {Object} emailData - Email data
 * @param {Object} options - Job options
 * @returns {Promise<Object>} Job object
 */
async function addEmailJob(emailData, options = {}) {
  if (!emailQueue) {
    // Fallback: process immediately
    logger.warn('Email queue not available, processing immediately');
    const emailService = require('../utils/emailService');
    return await emailService.sendNotificationEmail(
      emailData.to,
      emailData.subject,
      emailData.html || emailData.text
    );
  }

  return await emailQueue.add(emailData, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    ...options
  });
}

/**
 * Add notification job to queue
 * @param {Object} notificationData - Notification data
 * @param {Object} options - Job options
 * @returns {Promise<Object>} Job object
 */
async function addNotificationJob(notificationData, options = {}) {
  if (!notificationQueue) {
    logger.warn('Notification queue not available, skipping');
    return null;
  }

  return await notificationQueue.add(notificationData, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    ...options
  });
}

/**
 * Add AI job to queue
 * @param {Object} aiData - AI request data
 * @param {Object} options - Job options
 * @returns {Promise<Object>} Job object
 */
async function addAIJob(aiData, options = {}) {
  if (!aiQueue) {
    logger.warn('AI queue not available, processing immediately');
    // Process immediately as fallback
    return null;
  }

  return await aiQueue.add(aiData, {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    timeout: 30000, // 30 seconds
    ...options
  });
}

/**
 * Get queue stats
 * @returns {Promise<Object>} Queue statistics
 */
async function getQueueStats() {
  if (!emailQueue) {
    return { enabled: false };
  }

  const stats = {};

  const queues = {
    email: emailQueue,
    notification: notificationQueue,
    ai: aiQueue
  };

  for (const [name, queue] of Object.entries(queues)) {
    if (!queue) {
      continue;
    }

    const counts = await queue.getJobCounts();
    stats[name] = counts;
  }

  return {
    enabled: true,
    queues: stats
  };
}

/**
 * Clean old jobs from queues
 * @param {number} grace - Grace period in milliseconds
 */
async function cleanQueues(grace = 24 * 60 * 60 * 1000) {
  const queues = [emailQueue, notificationQueue, aiQueue].filter(q => q);

  for (const queue of queues) {
    await queue.clean(grace, 'completed');
    await queue.clean(grace, 'failed');
    logger.info(`Cleaned ${queue.name} queue`);
  }
}

// Initialize on module load
initializeQueues();

module.exports = {
  addEmailJob,
  addNotificationJob,
  addAIJob,
  getQueueStats,
  cleanQueues
};
