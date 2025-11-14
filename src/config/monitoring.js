/**
 * Advanced Monitoring and Alerting Configuration
 * Integrates with Prometheus, Grafana, and alerting systems
 */

const promClient = require('prom-client');
const logger = require('./logger');

class MonitoringService {
  constructor() {
    this.register = new promClient.Registry();
    this.metrics = {};
    this.isInitialized = false;
  }

  /**
   * Initialize monitoring
   */
  initialize() {
    if (this.isInitialized) return;

    // Default metrics (CPU, memory, etc.)
    promClient.collectDefaultMetrics({
      register: this.register,
      prefix: 'mysoulmate_',
      gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
    });

    // Custom metrics
    this.setupCustomMetrics();

    this.isInitialized = true;
    logger.info('Monitoring service initialized');
  }

  /**
   * Setup custom application metrics
   */
  setupCustomMetrics() {
    // HTTP request duration
    this.metrics.httpRequestDuration = new promClient.Histogram({
      name: 'mysoulmate_http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
      registers: [this.register]
    });

    // HTTP request total
    this.metrics.httpRequestTotal = new promClient.Counter({
      name: 'mysoulmate_http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.register]
    });

    // Active users
    this.metrics.activeUsers = new promClient.Gauge({
      name: 'mysoulmate_active_users',
      help: 'Number of currently active users',
      registers: [this.register]
    });

    // WebSocket connections
    this.metrics.websocketConnections = new promClient.Gauge({
      name: 'mysoulmate_websocket_connections',
      help: 'Number of active WebSocket connections',
      registers: [this.register]
    });

    // AI API calls
    this.metrics.aiApiCalls = new promClient.Counter({
      name: 'mysoulmate_ai_api_calls_total',
      help: 'Total number of AI API calls',
      labelNames: ['model', 'status'],
      registers: [this.register]
    });

    // AI API duration
    this.metrics.aiApiDuration = new promClient.Histogram({
      name: 'mysoulmate_ai_api_duration_seconds',
      help: 'Duration of AI API calls',
      labelNames: ['model'],
      buckets: [0.5, 1, 2, 5, 10, 30],
      registers: [this.register]
    });

    // Database query duration
    this.metrics.dbQueryDuration = new promClient.Histogram({
      name: 'mysoulmate_db_query_duration_seconds',
      help: 'Duration of database queries',
      labelNames: ['operation', 'table'],
      buckets: [0.001, 0.01, 0.05, 0.1, 0.5, 1],
      registers: [this.register]
    });

    // Cache hits/misses
    this.metrics.cacheHits = new promClient.Counter({
      name: 'mysoulmate_cache_hits_total',
      help: 'Total cache hits',
      labelNames: ['cache_name'],
      registers: [this.register]
    });

    this.metrics.cacheMisses = new promClient.Counter({
      name: 'mysoulmate_cache_misses_total',
      help: 'Total cache misses',
      labelNames: ['cache_name'],
      registers: [this.register]
    });

    // Queue size
    this.metrics.queueSize = new promClient.Gauge({
      name: 'mysoulmate_queue_size',
      help: 'Number of jobs in queue',
      labelNames: ['queue_name', 'status'],
      registers: [this.register]
    });

    // Email sent
    this.metrics.emailsSent = new promClient.Counter({
      name: 'mysoulmate_emails_sent_total',
      help: 'Total emails sent',
      labelNames: ['provider', 'status'],
      registers: [this.register]
    });

    // Subscription changes
    this.metrics.subscriptions = new promClient.Counter({
      name: 'mysoulmate_subscriptions_total',
      help: 'Total subscription changes',
      labelNames: ['action', 'tier'],
      registers: [this.register]
    });

    // Purchases
    this.metrics.purchases = new promClient.Counter({
      name: 'mysoulmate_purchases_total',
      help: 'Total purchases',
      labelNames: ['product_type'],
      registers: [this.register]
    });

    // Revenue (gauge for current value)
    this.metrics.revenue = new promClient.Gauge({
      name: 'mysoulmate_revenue_total',
      help: 'Total revenue in USD',
      registers: [this.register]
    });

    // Error rate
    this.metrics.errors = new promClient.Counter({
      name: 'mysoulmate_errors_total',
      help: 'Total errors',
      labelNames: ['type', 'severity'],
      registers: [this.register]
    });

    // 2FA usage
    this.metrics.twoFactorAuth = new promClient.Counter({
      name: 'mysoulmate_2fa_total',
      help: 'Total 2FA operations',
      labelNames: ['action', 'status'],
      registers: [this.register]
    });

    // GDPR requests
    this.metrics.gdprRequests = new promClient.Counter({
      name: 'mysoulmate_gdpr_requests_total',
      help: 'Total GDPR requests',
      labelNames: ['type'],
      registers: [this.register]
    });
  }

  /**
   * Track HTTP request
   */
  trackHttpRequest(method, route, statusCode, duration) {
    this.metrics.httpRequestDuration.labels(method, route, statusCode).observe(duration);
    this.metrics.httpRequestTotal.labels(method, route, statusCode).inc();
  }

  /**
   * Track AI API call
   */
  trackAICall(model, duration, success = true) {
    this.metrics.aiApiCalls.labels(model, success ? 'success' : 'error').inc();
    this.metrics.aiApiDuration.labels(model).observe(duration);
  }

  /**
   * Track database query
   */
  trackDbQuery(operation, table, duration) {
    this.metrics.dbQueryDuration.labels(operation, table).observe(duration);
  }

  /**
   * Track cache operation
   */
  trackCache(cacheName, hit) {
    if (hit) {
      this.metrics.cacheHits.labels(cacheName).inc();
    } else {
      this.metrics.cacheMisses.labels(cacheName).inc();
    }
  }

  /**
   * Update active users count
   */
  updateActiveUsers(count) {
    this.metrics.activeUsers.set(count);
  }

  /**
   * Update WebSocket connections
   */
  updateWebSocketConnections(count) {
    this.metrics.websocketConnections.set(count);
  }

  /**
   * Track email sent
   */
  trackEmail(provider, success = true) {
    this.metrics.emailsSent.labels(provider, success ? 'success' : 'error').inc();
  }

  /**
   * Track subscription change
   */
  trackSubscription(action, tier) {
    this.metrics.subscriptions.labels(action, tier).inc();
  }

  /**
   * Track purchase
   */
  trackPurchase(productType, amount) {
    this.metrics.purchases.labels(productType).inc();
    // Update total revenue
    this.metrics.revenue.inc(amount);
  }

  /**
   * Track error
   */
  trackError(type, severity = 'error') {
    this.metrics.errors.labels(type, severity).inc();
  }

  /**
   * Track queue size
   */
  updateQueueSize(queueName, status, size) {
    this.metrics.queueSize.labels(queueName, status).set(size);
  }

  /**
   * Get metrics for Prometheus
   */
  async getMetrics() {
    return await this.register.metrics();
  }

  /**
   * Get metrics in JSON format
   */
  async getMetricsJSON() {
    const metrics = await this.register.getMetricsAsJSON();
    return metrics;
  }

  /**
   * Reset all metrics (useful for testing)
   */
  reset() {
    this.register.clear();
    this.setupCustomMetrics();
  }
}

// Singleton instance
const monitoringService = new MonitoringService();

// Auto-initialize
monitoringService.initialize();

/**
 * Middleware to track HTTP requests
 */
function metricsMiddleware(req, res, next) {
  const start = Date.now();

  // Capture original end function
  const originalEnd = res.end;

  // Override end function
  res.end = function(...args) {
    const duration = (Date.now() - start) / 1000; // Convert to seconds
    const route = req.route ? req.route.path : req.path;

    monitoringService.trackHttpRequest(
      req.method,
      route,
      res.statusCode.toString(),
      duration
    );

    // Call original end
    return originalEnd.apply(res, args);
  };

  next();
}

/**
 * Endpoint to expose metrics
 */
function metricsEndpoint(req, res) {
  res.set('Content-Type', monitoringService.register.contentType);
  monitoringService.getMetrics()
    .then(metrics => res.end(metrics))
    .catch(err => {
      logger.error('Failed to get metrics:', err);
      res.status(500).end();
    });
}

/**
 * Alert configuration
 */
const alertConfig = {
  // High error rate alert
  highErrorRate: {
    threshold: 0.05, // 5% error rate
    window: 300, // 5 minutes
    severity: 'critical'
  },

  // Slow response time alert
  slowResponseTime: {
    threshold: 2, // 2 seconds
    percentile: 0.95, // 95th percentile
    severity: 'warning'
  },

  // Low memory alert
  lowMemory: {
    threshold: 0.9, // 90% memory usage
    severity: 'warning'
  },

  // High CPU alert
  highCPU: {
    threshold: 0.8, // 80% CPU usage
    duration: 300, // 5 minutes
    severity: 'warning'
  },

  // Database connection pool exhaustion
  dbPoolExhausted: {
    threshold: 0.9, // 90% of pool used
    severity: 'critical'
  },

  // Queue backup
  queueBackup: {
    threshold: 1000, // 1000 jobs
    severity: 'warning'
  }
};

/**
 * Send alert (integrate with PagerDuty, Slack, etc.)
 */
async function sendAlert(alert) {
  logger.error('ALERT:', alert);

  // TODO: Integrate with alerting service
  // - PagerDuty
  // - Slack
  // - Email
  // - SMS

  // Example: Slack webhook
  if (process.env.SLACK_WEBHOOK_URL) {
    try {
      const axios = require('axios');
      await axios.post(process.env.SLACK_WEBHOOK_URL, {
        text: `🚨 ${alert.severity.toUpperCase()}: ${alert.title}`,
        attachments: [{
          color: alert.severity === 'critical' ? 'danger' : 'warning',
          fields: [
            {
              title: 'Description',
              value: alert.description,
              short: false
            },
            {
              title: 'Metric',
              value: alert.metric,
              short: true
            },
            {
              title: 'Value',
              value: alert.value.toString(),
              short: true
            },
            {
              title: 'Threshold',
              value: alert.threshold.toString(),
              short: true
            },
            {
              title: 'Time',
              value: new Date().toISOString(),
              short: true
            }
          ]
        }]
      });
    } catch (error) {
      logger.error('Failed to send Slack alert:', error);
    }
  }
}

module.exports = {
  monitoringService,
  metricsMiddleware,
  metricsEndpoint,
  alertConfig,
  sendAlert
};
