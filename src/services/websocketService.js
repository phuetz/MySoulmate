/**
 * WebSocket Service for Real-time Features
 * Provides real-time communication for chat, notifications, and live updates
 */
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // userId -> Set of WebSocket connections
  }

  /**
   * Initialize WebSocket server
   * @param {Object} server - HTTP server instance
   */
  initialize(server) {
    this.wss = new WebSocket.Server({
      server,
      path: '/ws',
      verifyClient: this.verifyClient.bind(this)
    });

    this.wss.on('connection', this.handleConnection.bind(this));

    logger.info('WebSocket server initialized on /ws');
  }

  /**
   * Verify client before accepting connection
   */
  verifyClient(info, callback) {
    try {
      const url = new URL(info.req.url, 'ws://localhost');
      const token = url.searchParams.get('token');

      if (!token) {
        callback(false, 401, 'Unauthorized');
        return;
      }

      // Verify JWT token
      jwt.verify(token, process.env.JWT_SECRET || 'votre_secret_jwt', (err, decoded) => {
        if (err) {
          callback(false, 401, 'Invalid token');
          return;
        }

        // Attach user info to request
        info.req.user = decoded;
        callback(true);
      });
    } catch (error) {
      logger.error('WebSocket verification error:', error);
      callback(false, 500, 'Internal error');
    }
  }

  /**
   * Handle new WebSocket connection
   */
  handleConnection(ws, req) {
    const userId = req.user.id;
    logger.info(`WebSocket client connected: ${userId}`);

    // Store connection
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId).add(ws);

    // Setup event handlers
    ws.on('message', (data) => this.handleMessage(ws, userId, data));
    ws.on('close', () => this.handleDisconnect(ws, userId));
    ws.on('error', (error) => this.handleError(ws, userId, error));

    // Send welcome message
    this.sendToClient(ws, {
      type: 'connected',
      userId,
      timestamp: new Date().toISOString()
    });

    // Send pending notifications count
    this.sendPendingNotificationsCount(userId);
  }

  /**
   * Handle incoming message from client
   */
  handleMessage(ws, userId, data) {
    try {
      const message = JSON.parse(data);
      logger.debug(`WebSocket message from ${userId}:`, message.type);

      switch (message.type) {
        case 'ping':
          this.sendToClient(ws, { type: 'pong', timestamp: new Date().toISOString() });
          break;

        case 'chat':
          this.handleChatMessage(userId, message);
          break;

        case 'typing':
          this.broadcastTypingStatus(userId, message);
          break;

        case 'subscribe':
          this.handleSubscribe(ws, userId, message);
          break;

        default:
          logger.warn(`Unknown WebSocket message type: ${message.type}`);
      }
    } catch (error) {
      logger.error('Error handling WebSocket message:', error);
      this.sendToClient(ws, {
        type: 'error',
        message: 'Invalid message format'
      });
    }
  }

  /**
   * Handle chat message
   */
  handleChatMessage(userId, message) {
    // Broadcast to AI companion service or other users
    logger.info(`Chat message from ${userId}:`, message.content);

    // Echo back for now (in production, process through AI)
    this.sendToUser(userId, {
      type: 'chat',
      from: 'companion',
      content: message.content,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Broadcast typing status
   */
  broadcastTypingStatus(userId, message) {
    // Notify other users in the conversation (if applicable)
    this.sendToUser(userId, {
      type: 'typing',
      isTyping: message.isTyping,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle subscription to specific channels
   */
  handleSubscribe(ws, userId, message) {
    ws.channels = ws.channels || new Set();
    ws.channels.add(message.channel);

    this.sendToClient(ws, {
      type: 'subscribed',
      channel: message.channel
    });
  }

  /**
   * Handle client disconnect
   */
  handleDisconnect(ws, userId) {
    logger.info(`WebSocket client disconnected: ${userId}`);

    const userConnections = this.clients.get(userId);
    if (userConnections) {
      userConnections.delete(ws);
      if (userConnections.size === 0) {
        this.clients.delete(userId);
      }
    }
  }

  /**
   * Handle WebSocket error
   */
  handleError(ws, userId, error) {
    logger.error(`WebSocket error for user ${userId}:`, error);
  }

  /**
   * Send message to specific client connection
   */
  sendToClient(ws, data) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  /**
   * Send message to all connections of a user
   */
  sendToUser(userId, data) {
    const userConnections = this.clients.get(userId);
    if (userConnections) {
      userConnections.forEach(ws => {
        this.sendToClient(ws, data);
      });
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(data, excludeUserId = null) {
    this.clients.forEach((connections, userId) => {
      if (userId !== excludeUserId) {
        connections.forEach(ws => {
          this.sendToClient(ws, data);
        });
      }
    });
  }

  /**
   * Send notification to user
   */
  sendNotification(userId, notification) {
    this.sendToUser(userId, {
      type: 'notification',
      ...notification,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send pending notifications count
   */
  async sendPendingNotificationsCount(userId) {
    // This would query the database for unread notifications
    // For now, send a placeholder
    this.sendToUser(userId, {
      type: 'notifications_count',
      count: 0,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount() {
    return this.clients.size;
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId) {
    return this.clients.has(userId);
  }

  /**
   * Close all connections
   */
  close() {
    if (this.wss) {
      this.wss.clients.forEach(ws => {
        ws.close();
      });
      this.wss.close();
      logger.info('WebSocket server closed');
    }
  }
}

// Export singleton instance
module.exports = new WebSocketService();
