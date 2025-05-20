const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');

class WebSocketManager {
  constructor() {
    this.io = null;
    this.userSockets = new Map(); // Map of userId -> Set of socket IDs
  }

  // Initialize WebSocket server
  initialize(server) {
    this.io = socketIo(server, {
      cors: {
        origin: '*', // In production, restrict this to your frontend domain
        methods: ['GET', 'POST']
      }
    });

    // Set up authentication middleware
    this.io.use((socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        // Verify JWT token
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
          if (err) {
            return next(new Error('Authentication error: Invalid token'));
          }
          
          // Attach user data to socket
          socket.userId = decoded.userId;
          socket.userRole = decoded.role;
          next();
        });
      } catch (error) {
        console.error('WebSocket authentication error:', error);
        next(new Error('Authentication error'));
      }
    });

    // Handle connections
    this.io.on('connection', (socket) => {
      const userId = socket.userId;
      
      console.log(`User ${userId} connected via WebSocket`);
      
      // Add socket to user's socket collection
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId).add(socket.id);

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User ${userId} disconnected from WebSocket`);
        
        // Remove socket from user's socket collection
        if (this.userSockets.has(userId)) {
          this.userSockets.get(userId).delete(socket.id);
          
          // Clean up empty sets
          if (this.userSockets.get(userId).size === 0) {
            this.userSockets.delete(userId);
          }
        }
      });
    });

    console.log('WebSocket server initialized');
  }

  // Send notification to specific user
  sendNotificationToUser(userId, notification) {
    if (!this.io) {
      console.error('WebSocket server not initialized');
      return;
    }

    // If user has active connections, send notification
    if (this.userSockets.has(userId)) {
      const socketIds = this.userSockets.get(userId);
      
      socketIds.forEach(socketId => {
        this.io.to(socketId).emit('notification', notification);
      });
      
      console.log(`Notification sent to user ${userId} via WebSocket`);
    } else {
      console.log(`User ${userId} not connected, notification not sent via WebSocket`);
    }
  }

  // Send notification to all users with specific role
  sendNotificationToRole(role, notification) {
    if (!this.io) {
      console.error('WebSocket server not initialized');
      return;
    }

    // Find all sockets with the specified role
    const sockets = this.io.sockets.sockets;
    
    sockets.forEach(socket => {
      if (socket.userRole === role) {
        socket.emit('notification', notification);
      }
    });
    
    console.log(`Notification sent to all users with role ${role} via WebSocket`);
  }

  // Send notification to all connected users
  broadcastNotification(notification) {
    if (!this.io) {
      console.error('WebSocket server not initialized');
      return;
    }

    this.io.emit('notification', notification);
    console.log('Notification broadcasted to all users via WebSocket');
  }

  // Send notification update (read/delete) to specific user
  sendNotificationUpdateToUser(userId, update) {
    if (!this.io) {
      console.error('WebSocket server not initialized');
      return;
    }

    if (this.userSockets.has(userId)) {
      const socketIds = this.userSockets.get(userId);
      
      socketIds.forEach(socketId => {
        this.io.to(socketId).emit('notification_update', update);
      });
      
      console.log(`Notification update sent to user ${userId} via WebSocket`);
    }
  }
}

// Create singleton instance
const websocketManager = new WebSocketManager();

module.exports = websocketManager;
