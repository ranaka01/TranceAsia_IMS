import { io } from 'socket.io-client';
import { API_URL } from '../config';

// Create a singleton WebSocket service
class WebSocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.listeners = {};
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000; // 3 seconds
  }

  // Initialize the WebSocket connection
  connect() {
    if (this.socket) {
      console.log('WebSocket connection already exists');
      return;
    }

    try {
      // Get token for authentication
      const token = localStorage.getItem('token');
      
      // Create socket connection with auth token
      this.socket = io(API_URL, {
        auth: {
          token
        },
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectInterval,
        transports: ['websocket', 'polling']
      });

      // Set up event listeners
      this.socket.on('connect', () => {
        console.log('WebSocket connected');
        this.connected = true;
        this.reconnectAttempts = 0;
        
        // Notify all connection listeners
        this._notifyListeners('connection', { connected: true });
      });

      this.socket.on('disconnect', (reason) => {
        console.log(`WebSocket disconnected: ${reason}`);
        this.connected = false;
        
        // Notify all connection listeners
        this._notifyListeners('connection', { connected: false, reason });
      });

      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        this.reconnectAttempts++;
        
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('Max reconnect attempts reached, giving up');
          this.disconnect();
        }
      });

      // Listen for notification events
      this.socket.on('notification', (data) => {
        console.log('Received notification via WebSocket:', data);
        this._notifyListeners('notification', data);
      });

      // Listen for notification updates (read/delete)
      this.socket.on('notification_update', (data) => {
        console.log('Received notification update via WebSocket:', data);
        this._notifyListeners('notification_update', data);
      });

    } catch (error) {
      console.error('Error initializing WebSocket connection:', error);
    }
  }

  // Disconnect the WebSocket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      console.log('WebSocket disconnected');
    }
  }

  // Add event listener
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    
    return () => this.off(event, callback); // Return unsubscribe function
  }

  // Remove event listener
  off(event, callback) {
    if (!this.listeners[event]) return;
    
    this.listeners[event] = this.listeners[event].filter(
      listener => listener !== callback
    );
  }

  // Notify all listeners for a specific event
  _notifyListeners(event, data) {
    if (!this.listeners[event]) return;
    
    this.listeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }

  // Check if WebSocket is connected
  isConnected() {
    return this.connected && this.socket && this.socket.connected;
  }

  // Reconnect WebSocket if disconnected
  reconnect() {
    if (this.isConnected()) {
      console.log('WebSocket already connected');
      return;
    }
    
    this.disconnect();
    this.connect();
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService;
