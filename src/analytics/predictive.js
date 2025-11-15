/**
 * Predictive Analytics Engine
 * AI-powered predictions and recommendations
 */

const logger = require('../config/logger');

class PredictiveAnalytics {
  constructor() {
    this.models = {
      churn: null,
      ltv: null,
      engagement: null,
      sentiment: null
    };
  }

  /**
   * Predict user churn probability
   */
  async predictChurn(userId) {
    try {
      const features = await this.extractChurnFeatures(userId);
      const churnProbability = await this.runModel('churn', features);

      // Store prediction
      await this.storePrediction({
        userId,
        type: 'churn',
        probability: churnProbability,
        features,
        timestamp: new Date()
      });

      // Trigger intervention if high risk
      if (churnProbability > 0.7) {
        await this.triggerRetentionCampaign(userId, churnProbability);
      }

      return {
        probability: churnProbability,
        risk: this.getRiskLevel(churnProbability),
        recommendations: await this.getChurnRecommendations(userId, churnProbability)
      };
    } catch (error) {
      logger.error('Churn prediction failed:', error);
      throw error;
    }
  }

  /**
   * Extract features for churn prediction
   */
  async extractChurnFeatures(userId) {
    const { User, AnalyticsEvent, Subscription } = require('../models');
    const { Op } = require('sequelize');

    const user = await User.findByPk(userId);
    const subscription = await Subscription.findOne({ where: { userId } });

    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    // Activity metrics
    const recentEvents = await AnalyticsEvent.count({
      where: {
        userId,
        timestamp: { [Op.gte]: thirtyDaysAgo }
      }
    });

    const loginEvents = await AnalyticsEvent.count({
      where: {
        userId,
        eventName: 'User Login',
        timestamp: { [Op.gte]: thirtyDaysAgo }
      }
    });

    const lastLogin = await AnalyticsEvent.findOne({
      where: { userId, eventName: 'User Login' },
      order: [['timestamp', 'DESC']]
    });

    const daysSinceLastLogin = lastLogin
      ? (now - new Date(lastLogin.timestamp)) / (1000 * 60 * 60 * 24)
      : 999;

    return {
      accountAge: (now - new Date(user.createdAt)) / (1000 * 60 * 60 * 24),
      isPremium: subscription?.tier === 'premium' || subscription?.tier === 'elite',
      daysSinceLastLogin,
      loginsLast30Days: loginEvents,
      eventsLast30Days: recentEvents,
      avgEventsPerDay: recentEvents / 30,
      hasSubscription: !!subscription,
      subscriptionAge: subscription
        ? (now - new Date(subscription.startDate)) / (1000 * 60 * 60 * 24)
        : 0
    };
  }

  /**
   * Predict customer lifetime value
   */
  async predictLTV(userId) {
    try {
      const features = await this.extractLTVFeatures(userId);
      const ltv = await this.runModel('ltv', features);

      return {
        predicted_ltv: ltv,
        confidence: 0.85,
        timeframe: '12_months',
        breakdown: {
          subscription_revenue: ltv * 0.7,
          purchases_revenue: ltv * 0.3
        }
      };
    } catch (error) {
      logger.error('LTV prediction failed:', error);
      throw error;
    }
  }

  /**
   * Extract features for LTV prediction
   */
  async extractLTVFeatures(userId) {
    const { User, Subscription, AnalyticsEvent } = require('../models');
    const { Op } = require('sequelize');

    const user = await User.findByPk(userId);
    const subscription = await Subscription.findOne({ where: { userId } });

    // Purchase history
    const purchases = await AnalyticsEvent.count({
      where: {
        userId,
        eventName: 'Purchase'
      }
    });

    const totalSpent = await this.getTotalSpent(userId);

    return {
      accountAge: (new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24),
      isPremium: subscription?.tier === 'premium' || subscription?.tier === 'elite',
      totalPurchases: purchases,
      totalSpent,
      avgPurchaseValue: purchases > 0 ? totalSpent / purchases : 0,
      engagementScore: await this.calculateEngagementScore(userId)
    };
  }

  /**
   * Predict next best action for user
   */
  async predictNextBestAction(userId) {
    try {
      const userProfile = await this.getUserProfile(userId);
      const engagementLevel = await this.calculateEngagementScore(userId);
      const churnRisk = await this.predictChurn(userId);

      const actions = [];

      // High churn risk
      if (churnRisk.probability > 0.6) {
        actions.push({
          action: 'send_retention_offer',
          priority: 1,
          message: 'Offer premium trial or discount',
          expected_impact: 0.8
        });
      }

      // Low engagement
      if (engagementLevel < 0.3) {
        actions.push({
          action: 'send_engagement_campaign',
          priority: 2,
          message: 'Send feature discovery email',
          expected_impact: 0.6
        });
      }

      // High value but not premium
      const ltv = await this.predictLTV(userId);
      if (ltv.predicted_ltv > 100 && !userProfile.isPremium) {
        actions.push({
          action: 'upsell_premium',
          priority: 3,
          message: 'Promote premium subscription',
          expected_impact: 0.7
        });
      }

      // High engagement, no recent purchase
      if (engagementLevel > 0.7 && await this.daysSinceLastPurchase(userId) > 30) {
        actions.push({
          action: 'recommend_products',
          priority: 4,
          message: 'Show personalized product recommendations',
          expected_impact: 0.5
        });
      }

      return actions.sort((a, b) => a.priority - b.priority);
    } catch (error) {
      logger.error('Next best action prediction failed:', error);
      throw error;
    }
  }

  /**
   * Predict optimal messaging time
   */
  async predictOptimalMessagingTime(userId) {
    try {
      const { AnalyticsEvent } = require('../models');

      // Get user's historical engagement times
      const events = await AnalyticsEvent.findAll({
        where: {
          userId,
          eventName: 'User Login'
        },
        attributes: ['timestamp'],
        limit: 100,
        order: [['timestamp', 'DESC']]
      });

      // Analyze hour distribution
      const hourCounts = new Array(24).fill(0);
      events.forEach(event => {
        const hour = new Date(event.timestamp).getHours();
        hourCounts[hour]++;
      });

      // Find peak hours
      const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
      const secondPeakHour = hourCounts.indexOf(
        Math.max(...hourCounts.filter((_, i) => i !== peakHour))
      );

      return {
        primary: {
          hour: peakHour,
          confidence: hourCounts[peakHour] / events.length
        },
        secondary: {
          hour: secondPeakHour,
          confidence: hourCounts[secondPeakHour] / events.length
        },
        timezone: 'UTC' // TODO: Use user's actual timezone
      };
    } catch (error) {
      logger.error('Optimal messaging time prediction failed:', error);
      return { primary: { hour: 9, confidence: 0.5 }, secondary: { hour: 18, confidence: 0.3 } };
    }
  }

  /**
   * Cohort analysis and prediction
   */
  async analyzeCohort(startDate, endDate) {
    try {
      const { User, AnalyticsEvent } = require('../models');
      const { Op } = require('sequelize');

      // Get users in cohort
      const users = await User.findAll({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate]
          }
        }
      });

      const cohortSize = users.length;
      const userIds = users.map(u => u.id);

      // Calculate retention by week
      const retention = [];
      const cohortStart = new Date(startDate);

      for (let week = 0; week < 12; week++) {
        const weekStart = new Date(cohortStart.getTime() + week * 7 * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

        const activeUsers = await AnalyticsEvent.count({
          where: {
            userId: { [Op.in]: userIds },
            timestamp: { [Op.between]: [weekStart, weekEnd] }
          },
          distinct: true,
          col: 'userId'
        });

        retention.push({
          week,
          activeUsers,
          retentionRate: activeUsers / cohortSize,
          weekStart
        });
      }

      // Predict future retention
      const predictedRetention = this.predictFutureRetention(retention);

      return {
        cohortSize,
        retention,
        predictedRetention,
        ltv: await this.predictCohortLTV(userIds),
        churnRate: 1 - (retention[retention.length - 1]?.retentionRate || 0)
      };
    } catch (error) {
      logger.error('Cohort analysis failed:', error);
      throw error;
    }
  }

  /**
   * Helper functions
   */

  async runModel(modelType, features) {
    // Placeholder - in production, call actual ML model
    // For now, use heuristic-based prediction

    switch (modelType) {
      case 'churn':
        return this.heuristicChurnPrediction(features);
      case 'ltv':
        return this.heuristicLTVPrediction(features);
      default:
        return 0;
    }
  }

  heuristicChurnPrediction(features) {
    let score = 0;

    // High risk if hasn't logged in recently
    if (features.daysSinceLastLogin > 14) score += 0.4;
    if (features.daysSinceLastLogin > 30) score += 0.3;

    // Low activity
    if (features.avgEventsPerDay < 1) score += 0.2;

    // No subscription
    if (!features.hasSubscription) score += 0.1;

    return Math.min(score, 1.0);
  }

  heuristicLTVPrediction(features) {
    let ltv = 0;

    // Base value
    if (features.isPremium) {
      ltv += 120; // $10/month * 12 months
    } else {
      ltv += 20; // Free user value
    }

    // Purchase behavior
    ltv += features.avgPurchaseValue * 12;

    // Engagement multiplier
    ltv *= (1 + features.engagementScore);

    return Math.round(ltv * 100) / 100;
  }

  async calculateEngagementScore(userId) {
    const { AnalyticsEvent } = require('../models');
    const { Op } = require('sequelize');

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const events = await AnalyticsEvent.count({
      where: {
        userId,
        timestamp: { [Op.gte]: thirtyDaysAgo }
      }
    });

    // Normalize to 0-1 scale (assume 50 events/month is high engagement)
    return Math.min(events / 50, 1.0);
  }

  async getUserProfile(userId) {
    const { User, Subscription } = require('../models');
    const user = await User.findByPk(userId);
    const subscription = await Subscription.findOne({ where: { userId } });

    return {
      isPremium: subscription?.tier === 'premium' || subscription?.tier === 'elite',
      role: user.role,
      accountAge: (new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)
    };
  }

  async getTotalSpent(userId) {
    // TODO: Implement actual calculation from purchase history
    return 0;
  }

  async daysSinceLastPurchase(userId) {
    // TODO: Implement actual calculation
    return 999;
  }

  getRiskLevel(probability) {
    if (probability > 0.7) return 'HIGH';
    if (probability > 0.4) return 'MEDIUM';
    return 'LOW';
  }

  async getChurnRecommendations(userId, probability) {
    return [
      'Send personalized retention email',
      'Offer premium trial',
      'Highlight unused features',
      'Request feedback survey'
    ];
  }

  async triggerRetentionCampaign(userId, probability) {
    logger.info(`Triggering retention campaign for user ${userId} (churn probability: ${probability})`);
    // TODO: Integrate with email/notification system
  }

  async storePrediction(prediction) {
    // TODO: Store in database for tracking
    logger.info('Prediction stored:', prediction);
  }

  predictFutureRetention(historicalRetention) {
    // Simple linear regression
    // In production, use more sophisticated time-series models
    const n = historicalRetention.length;
    if (n < 2) return [];

    const lastRate = historicalRetention[n - 1].retentionRate;
    const prevRate = historicalRetention[n - 2].retentionRate;
    const trend = lastRate - prevRate;

    const predictions = [];
    let currentRate = lastRate;

    for (let i = 0; i < 4; i++) {
      currentRate = Math.max(0, currentRate + trend);
      predictions.push({
        week: n + i,
        predictedRetentionRate: currentRate,
        confidence: 0.7 - (i * 0.1)
      });
    }

    return predictions;
  }

  async predictCohortLTV(userIds) {
    // Average LTV prediction for cohort
    let totalLTV = 0;
    for (const userId of userIds.slice(0, 100)) { // Sample for performance
      const ltv = await this.predictLTV(userId);
      totalLTV += ltv.predicted_ltv;
    }
    return totalLTV / Math.min(userIds.length, 100);
  }
}

// Singleton instance
const predictiveAnalytics = new PredictiveAnalytics();

module.exports = {
  PredictiveAnalytics,
  predictiveAnalytics
};
