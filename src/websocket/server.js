/**
 * WebSocket Server for Real-time Communication
 *
 * Handles real-time chat, presence, typing indicators, etc.
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

let io;

/**
 * Initialize WebSocket server
 * @param {Object} httpServer - HTTP server instance
 */
function initializeWebSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || '*',
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token ||
                    socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // Verify JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userEmail = decoded.email;

      logger.info('WebSocket client authenticated', {
        userId: decoded.id,
        socketId: socket.id
      });

      next();
    } catch (error) {
      logger.error('WebSocket authentication failed:', error);
      next(new Error('Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    logger.info('WebSocket client connected', {
      userId: socket.userId,
      socketId: socket.id
    });

    // Join user's personal room
    socket.join(`user:${socket.userId}`);

    // Emit online status
    socket.broadcast.emit('user:online', {
      userId: socket.userId
    });

    // Handle chat messages
    socket.on('message:send', async (data) => {
      try {
        const { companionId, message } = data;

        logger.info('Message sent via WebSocket', {
          userId: socket.userId,
          companionId,
          messageLength: message.length
        });

        // Save message to database
        // const savedMessage = await saveMessage(...)

        // Emit to companion room (for group chats)
        io.to(`companion:${companionId}`).emit('message:new', {
          userId: socket.userId,
          companionId,
          message,
          timestamp: new Date().toISOString()
        });

        // Acknowledge receipt
        socket.emit('message:sent', {
          success: true,
          messageId: 'temp-id', // Replace with actual ID
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        logger.error('Message send error:', error);
        socket.emit('message:error', {
          error: 'Failed to send message'
        });
      }
    });

    // Handle typing indicator
    socket.on('typing:start', (data) => {
      const { companionId } = data;

      socket.to(`companion:${companionId}`).emit('typing:user', {
        userId: socket.userId,
        isTyping: true
      });
    });

    socket.on('typing:stop', (data) => {
      const { companionId } = data;

      socket.to(`companion:${companionId}`).emit('typing:user', {
        userId: socket.userId,
        isTyping: false
      });
    });

    // Handle presence
    socket.on('presence:update', (data) => {
      const { status } = data; // online, away, busy, offline

      socket.broadcast.emit('presence:changed', {
        userId: socket.userId,
        status,
        timestamp: new Date().toISOString()
      });
    });

    // Handle room join/leave
    socket.on('room:join', (data) => {
      const { roomId } = data;
      socket.join(roomId);

      logger.info('User joined room', {
        userId: socket.userId,
        roomId
      });

      socket.to(roomId).emit('room:user-joined', {
        userId: socket.userId,
        roomId
      });
    });

    socket.on('room:leave', (data) => {
      const { roomId } = data;
      socket.leave(roomId);

      logger.info('User left room', {
        userId: socket.userId,
        roomId
      });

      socket.to(roomId).emit('room:user-left', {
        userId: socket.userId,
        roomId
      });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info('WebSocket client disconnected', {
        userId: socket.userId,
        socketId: socket.id,
        reason
      });

      // Emit offline status
      socket.broadcast.emit('user:offline', {
        userId: socket.userId,
        timestamp: new Date().toISOString()
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error('WebSocket error:', {
        userId: socket.userId,
        socketId: socket.id,
        error
      });
    });
  });

  logger.info('WebSocket server initialized');
  return io;
}

/**
 * Emit event to specific user
 * @param {number} userId - User ID
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
function emitToUser(userId, event, data) {
  if (!io) {
    logger.warn('WebSocket not initialized');
    return;
  }

  io.to(`user:${userId}`).emit(event, data);
}

/**
 * Emit event to room
 * @param {string} roomId - Room ID
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
function emitToRoom(roomId, event, data) {
  if (!io) {
    logger.warn('WebSocket not initialized');
    return;
  }

  io.to(roomId).emit(event, data);
}

/**
 * Get connected users count
 * @returns {number} Connected users
 */
function getConnectedUsersCount() {
  if (!io) {
    return 0;
  }

  return io.sockets.sockets.size;
}

module.exports = {
  initializeWebSocket,
  emitToUser,
  emitToRoom,
  getConnectedUsersCount
};
