const express = require('express');
const notificationController = require('../Controllers/NotificationController');
const { authenticateUser } = require('../utils/authenticateUser');
const { authorizeRole } = require('../utils/authorizeRoles');

const router = express.Router();

// Create a middleware for optional authentication
const optionalAuth = (req, res, next) => {
  // If no Authorization header is present, just continue
  if (!req.headers || !req.headers['authorization']) {
    console.log('No authorization header, continuing without authentication');
    return next();
  }

  // Otherwise, try to authenticate the user
  authenticateUser(req, res, (err) => {
    if (err) {
      // If authentication fails, just continue without user info
      console.log('Authentication failed, continuing without user info:', err.message);
      return next();
    }
    console.log('User authenticated successfully:', req.user ? req.user.userId : 'No user ID');
    next();
  });
};

// Routes with optional authentication
router.get('/', optionalAuth, notificationController.getNotifications);
router.get('/unread-count', optionalAuth, notificationController.getUnreadCount);

// Routes that require authentication
router.post('/mark-all-read', authenticateUser, notificationController.markAllAsRead);
router.delete('/all', authenticateUser, notificationController.deleteAllNotifications);
router.patch('/:id/mark-read', authenticateUser, notificationController.markAsRead);
router.delete('/:id', authenticateUser, notificationController.deleteNotification);

module.exports = router;
