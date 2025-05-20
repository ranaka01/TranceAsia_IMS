const Notification = require('../Models/NotificationModel');

// Get all notifications for the authenticated user
exports.getNotifications = async (req, res) => {
  try {
    // Get userId if user is authenticated
    const userId = req.user ? req.user.userId : null;
    const { limit, offset, isRead, type } = req.query;

    console.log('GET /notifications request received');
    console.log('User ID:', userId);
    console.log('Query params:', { limit, offset, isRead, type });
    console.log('Request headers:', req.headers);

    // Parse query parameters
    const options = {
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
      isRead: isRead !== undefined ? isRead === 'true' : undefined,
      type: type || undefined
    };

    console.log('Fetching notifications with options:', options);

    const notifications = await Notification.findAllForUser(userId, options);

    console.log(`Found ${notifications.length} notifications`);
    if (notifications.length > 0) {
      console.log('First notification:', {
        id: notifications[0].id,
        title: notifications[0].title,
        type: notifications[0].type,
        created_at: notifications[0].created_at
      });
    }

    res.status(200).json({
      status: 'success',
      results: notifications.length,
      data: {
        notifications
      }
    });
  } catch (error) {
    console.error("Error in getNotifications:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Get unread notification count for the authenticated user
exports.getUnreadCount = async (req, res) => {
  try {
    // Get userId if user is authenticated
    const userId = req.user ? req.user.userId : null;
    const count = await Notification.getUnreadCountForUser(userId);

    res.status(200).json({
      status: 'success',
      data: {
        count
      }
    });
  } catch (error) {
    console.error("Error in getUnreadCount:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Mark a notification as read
exports.markAsRead = async (req, res) => {
  try {
    // Get userId if user is authenticated
    const userId = req.user ? req.user.userId : null;
    const notificationId = req.params.id;

    const success = await Notification.markAsRead(notificationId, userId);

    if (!success) {
      return res.status(404).json({
        status: 'fail',
        message: 'Notification not found or not accessible'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        message: 'Notification marked as read'
      }
    });
  } catch (error) {
    console.error("Error in markAsRead:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Mark all notifications as read for the authenticated user
exports.markAllAsRead = async (req, res) => {
  try {
    // Get userId if user is authenticated
    const userId = req.user ? req.user.userId : null;
    const count = await Notification.markAllAsRead(userId);

    res.status(200).json({
      status: 'success',
      data: {
        message: `${count} notifications marked as read`
      }
    });
  } catch (error) {
    console.error("Error in markAllAsRead:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
  try {
    // Get userId if user is authenticated
    const userId = req.user ? req.user.userId : null;
    const notificationId = req.params.id;

    const success = await Notification.delete(notificationId, userId);

    if (!success) {
      return res.status(404).json({
        status: 'fail',
        message: 'Notification not found or not accessible'
      });
    }

    res.status(200).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    console.error("Error in deleteNotification:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Delete all notifications for the authenticated user
exports.deleteAllNotifications = async (req, res) => {
  try {
    // Get userId if user is authenticated
    const userId = req.user ? req.user.userId : null;
    const count = await Notification.deleteAll(userId);

    res.status(200).json({
      status: 'success',
      data: {
        message: `${count} notifications deleted`
      }
    });
  } catch (error) {
    console.error("Error in deleteAllNotifications:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};
