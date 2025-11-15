/**
 * Machine Learning Operations Pipeline
 * Advanced ML model management and deployment
 */

const logger = require('../config/logger');
const fs = require('fs').promises;
const path = require('path');

class MLPipeline {
  constructor() {
    this.models = new Map();
    this.modelVersions = new Map();
    this.experiments = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize ML Pipeline
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      // Load TensorFlow.js if available
      if (process.env.ML_ENABLED === 'true') {
        this.tf = require('@tensorflow/tfjs-node');
        logger.info('TensorFlow.js loaded successfully');
      }

      // Load model registry
      await this.loadModelRegistry();

      this.isInitialized = true;
      logger.info('ML Pipeline initialized');
    } catch (error) {
      logger.error('ML Pipeline initialization failed:', error);
    }
  }

  /**
   * Load model registry from database
   */
  async loadModelRegistry() {
    try {
      const { MLModel } = require('../models');
      const models = await MLModel.findAll({
        where: { status: 'active' }
      });

      models.forEach(model => {
        this.models.set(model.name, {
          id: model.id,
          name: model.name,
          version: model.version,
          type: model.type,
          path: model.path,
          metadata: JSON.parse(model.metadata || '{}'),
          metrics: JSON.parse(model.metrics || '{}')
        });
      });

      logger.info(`Loaded ${models.length} ML models`);
    } catch (error) {
      logger.error('Failed to load model registry:', error);
    }
  }

  /**
   * Register a new model
   */
  async registerModel(name, version, type, path, metadata = {}) {
    try {
      const { MLModel } = require('../models');

      const model = await MLModel.create({
        name,
        version,
        type,
        path,
        metadata: JSON.stringify(metadata),
        status: 'active',
        createdAt: new Date()
      });

      this.models.set(name, {
        id: model.id,
        name,
        version,
        type,
        path,
        metadata
      });

      logger.info(`Model registered: ${name} v${version}`);
      return model;
    } catch (error) {
      logger.error('Failed to register model:', error);
      throw error;
    }
  }

  /**
   * Load a model for inference
   */
  async loadModel(name) {
    if (!this.tf) {
      throw new Error('TensorFlow.js not available');
    }

    const modelInfo = this.models.get(name);
    if (!modelInfo) {
      throw new Error(`Model not found: ${name}`);
    }

    try {
      const model = await this.tf.loadLayersModel(`file://${modelInfo.path}`);
      logger.info(`Model loaded: ${name}`);
      return model;
    } catch (error) {
      logger.error(`Failed to load model ${name}:`, error);
      throw error;
    }
  }

  /**
   * Predict using a model
   */
  async predict(modelName, input) {
    try {
      const model = await this.loadModel(modelName);
      const tensorInput = this.tf.tensor(input);
      const prediction = model.predict(tensorInput);
      const result = await prediction.array();

      // Cleanup tensors
      tensorInput.dispose();
      prediction.dispose();

      // Track prediction
      await this.trackPrediction(modelName, input, result);

      return result;
    } catch (error) {
      logger.error('Prediction failed:', error);
      throw error;
    }
  }

  /**
   * Track prediction for monitoring
   */
  async trackPrediction(modelName, input, output) {
    try {
      const { MLPrediction } = require('../models');

      await MLPrediction.create({
        modelName,
        input: JSON.stringify(input),
        output: JSON.stringify(output),
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Failed to track prediction:', error);
    }
  }

  /**
   * A/B Testing - Route to model variant
   */
  async predictWithABTest(experimentName, input, userId) {
    const variant = await this.getVariant(experimentName, userId);
    const modelName = `${experimentName}_${variant}`;

    const result = await this.predict(modelName, input);

    // Track experiment result
    await this.trackExperiment(experimentName, variant, userId, result);

    return { result, variant };
  }

  /**
   * Get A/B test variant for user
   */
  async getVariant(experimentName, userId) {
    // Consistent hashing for stable variant assignment
    const hash = this.hashUserId(userId);
    const experiment = this.experiments.get(experimentName);

    if (!experiment) {
      return 'control';
    }

    // Determine variant based on split percentage
    const percentage = hash % 100;
    let cumulative = 0;

    for (const [variant, split] of Object.entries(experiment.splits)) {
      cumulative += split;
      if (percentage < cumulative) {
        return variant;
      }
    }

    return 'control';
  }

  /**
   * Create A/B test experiment
   */
  async createExperiment(name, splits, models) {
    this.experiments.set(name, {
      name,
      splits, // { control: 50, variant_a: 30, variant_b: 20 }
      models, // { control: 'model_v1', variant_a: 'model_v2', variant_b: 'model_v3' }
      createdAt: new Date()
    });

    logger.info(`Experiment created: ${name}`, splits);
  }

  /**
   * Track experiment result
   */
  async trackExperiment(experimentName, variant, userId, result) {
    try {
      const { ExperimentResult } = require('../models');

      await ExperimentResult.create({
        experimentName,
        variant,
        userId,
        result: JSON.stringify(result),
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Failed to track experiment:', error);
    }
  }

  /**
   * Get experiment metrics
   */
  async getExperimentMetrics(experimentName) {
    try {
      const { ExperimentResult } = require('../models');
      const sequelize = require('../config/database');

      const results = await ExperimentResult.findAll({
        attributes: [
          'variant',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('AVG', sequelize.col('score')), 'avgScore']
        ],
        where: { experimentName },
        group: ['variant'],
        raw: true
      });

      return results;
    } catch (error) {
      logger.error('Failed to get experiment metrics:', error);
      return [];
    }
  }

  /**
   * Feature Engineering - Extract features from data
   */
  extractFeatures(data, featureConfig) {
    const features = [];

    for (const config of featureConfig) {
      switch (config.type) {
        case 'numeric':
          features.push(parseFloat(data[config.field]) || 0);
          break;

        case 'categorical':
          const oneHot = this.oneHotEncode(data[config.field], config.categories);
          features.push(...oneHot);
          break;

        case 'text':
          const embedding = this.textToEmbedding(data[config.field]);
          features.push(...embedding);
          break;

        case 'datetime':
          const timeFeatures = this.extractTimeFeatures(data[config.field]);
          features.push(...timeFeatures);
          break;
      }
    }

    return features;
  }

  /**
   * One-hot encoding
   */
  oneHotEncode(value, categories) {
    return categories.map(cat => (cat === value ? 1 : 0));
  }

  /**
   * Text to embedding (simple bag-of-words)
   */
  textToEmbedding(text, vocabSize = 100) {
    // Simple implementation - in production, use pre-trained embeddings
    const words = text.toLowerCase().split(' ');
    const embedding = new Array(vocabSize).fill(0);

    words.forEach(word => {
      const hash = this.hashString(word) % vocabSize;
      embedding[hash] += 1;
    });

    return embedding;
  }

  /**
   * Extract time-based features
   */
  extractTimeFeatures(datetime) {
    const date = new Date(datetime);
    return [
      date.getHours() / 24,           // Hour normalized
      date.getDay() / 7,              // Day of week normalized
      date.getDate() / 31,            // Day of month normalized
      date.getMonth() / 12,           // Month normalized
      Math.sin(2 * Math.PI * date.getHours() / 24), // Hour cyclic
      Math.cos(2 * Math.PI * date.getHours() / 24)
    ];
  }

  /**
   * Model performance monitoring
   */
  async monitorModel(modelName) {
    try {
      const { MLPrediction } = require('../models');
      const { Op } = require('sequelize');

      // Get predictions from last 24 hours
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const predictions = await MLPrediction.findAll({
        where: {
          modelName,
          timestamp: { [Op.gte]: yesterday }
        }
      });

      // Calculate metrics
      const metrics = {
        total: predictions.length,
        avgLatency: this.calculateAvgLatency(predictions),
        errorRate: this.calculateErrorRate(predictions),
        drift: await this.detectDrift(modelName, predictions)
      };

      // Alert if metrics degrade
      if (metrics.errorRate > 0.1) {
        logger.warn(`High error rate detected for model ${modelName}: ${metrics.errorRate}`);
        await this.sendAlert('high_error_rate', modelName, metrics);
      }

      if (metrics.drift > 0.3) {
        logger.warn(`Data drift detected for model ${modelName}: ${metrics.drift}`);
        await this.sendAlert('data_drift', modelName, metrics);
      }

      return metrics;
    } catch (error) {
      logger.error('Model monitoring failed:', error);
      return null;
    }
  }

  /**
   * Detect data drift
   */
  async detectDrift(modelName, recentPredictions) {
    // Simple drift detection using distribution comparison
    // In production, use KL-divergence or other statistical tests

    const baseline = await this.getBaselineDistribution(modelName);
    if (!baseline) return 0;

    const current = this.getCurrentDistribution(recentPredictions);

    // Calculate simple difference
    let drift = 0;
    for (const key in baseline) {
      drift += Math.abs(baseline[key] - (current[key] || 0));
    }

    return drift / Object.keys(baseline).length;
  }

  /**
   * Send alert
   */
  async sendAlert(type, modelName, data) {
    // TODO: Integrate with alerting system (Slack, PagerDuty, etc.)
    logger.error(`ML Alert [${type}]: ${modelName}`, data);
  }

  /**
   * Utility functions
   */
  hashUserId(userId) {
    let hash = 0;
    const str = userId.toString();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  calculateAvgLatency(predictions) {
    if (predictions.length === 0) return 0;
    const total = predictions.reduce((sum, p) => sum + (p.latency || 0), 0);
    return total / predictions.length;
  }

  calculateErrorRate(predictions) {
    if (predictions.length === 0) return 0;
    const errors = predictions.filter(p => p.error).length;
    return errors / predictions.length;
  }

  async getBaselineDistribution(modelName) {
    // Load baseline from model metadata
    const modelInfo = this.models.get(modelName);
    return modelInfo?.metadata?.baselineDistribution || null;
  }

  getCurrentDistribution(predictions) {
    // Calculate current distribution from predictions
    const dist = {};
    predictions.forEach(p => {
      const output = JSON.parse(p.output);
      const key = Array.isArray(output) ? output[0] : output;
      dist[key] = (dist[key] || 0) + 1;
    });

    // Normalize
    const total = predictions.length;
    for (const key in dist) {
      dist[key] = dist[key] / total;
    }

    return dist;
  }
}

// Singleton instance
const mlPipeline = new MLPipeline();

module.exports = {
  MLPipeline,
  mlPipeline
};
