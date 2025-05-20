import API from '../utils/api';

// Get all notifications with optional filters
export const getNotifications = async (filters = {}) => {
  try {
    const { limit, offset, isRead, type } = filters;

    // Build query string
    let queryParams = [];
    if (limit) queryParams.push(`limit=${limit}`);
    if (offset) queryParams.push(`offset=${offset}`);
    if (isRead !== undefined) queryParams.push(`isRead=${isRead}`);
    if (type) queryParams.push(`type=${type}`);

    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

    console.log('Fetching notifications with query:', queryString);
    const response = await API.get(`/notifications${queryString}`);
    console.log('API response:', response.data);

    // Process notifications to handle potential data parsing errors
    const notifications = response.data.data.notifications || [];
    console.log('Raw notifications from API:', notifications);

    return notifications.map(notification => {
      console.log('Processing notification:', notification.id, notification.type);

      // Handle potential JSON parsing errors for the data field
      if (notification.data && typeof notification.data === 'string') {
        try {
          notification.data = JSON.parse(notification.data);
          console.log('Successfully parsed data for notification:', notification.id);
        } catch (err) {
          console.error(`Error parsing notification data for ID ${notification.id}:`, err);
          notification.data = { error: 'Invalid data format' };
        }
      } else if (!notification.data && notification.type === 'repair') {
        // Create default data structure for repair notifications if missing
        console.warn(`Repair notification ${notification.id} missing data, creating default structure`);
        notification.data = {
          repairId: 'Unknown',
          customer: 'Unknown',
          deviceType: 'Unknown',
          deviceModel: 'Unknown',
          previousStatus: 'Unknown',
          newStatus: 'Unknown',
          timestamp: new Date().toISOString()
        };
      }

      // Ensure both is_read and isRead properties exist for compatibility
      if (notification.isRead !== undefined && notification.is_read === undefined) {
        notification.is_read = notification.isRead;
      } else if (notification.is_read !== undefined && notification.isRead === undefined) {
        notification.isRead = notification.is_read;
      } else if (notification.isRead === undefined && notification.is_read === undefined) {
        // Default to unread if neither property exists
        notification.is_read = false;
        notification.isRead = false;
      }

      return notification;
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    // Return empty array instead of throwing error to prevent UI from breaking
    return [];
  }
};

// Get unread notification count
export const getUnreadCount = async () => {
  try {
    const response = await API.get('/notifications/unread-count');
    return response.data.data.count;
  } catch (error) {
    console.error('Error fetching unread notification count:', error);
    // Return 0 instead of throwing error to prevent UI from breaking
    return 0;
  }
};

// Mark a notification as read
export const markAsRead = async (id) => {
  try {
    const response = await API.patch(`/notifications/${id}/mark-read`);
    return response.data;
  } catch (error) {
    console.error(`Error marking notification ${id} as read:`, error);
    // Return a standardized error response
    return {
      status: 'error',
      message: error.response?.data?.message || 'Failed to mark notification as read'
    };
  }
};

// Mark all notifications as read
export const markAllAsRead = async () => {
  try {
    const response = await API.post('/notifications/mark-all-read');
    return response.data;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    // Return a standardized error response
    return {
      status: 'error',
      message: error.response?.data?.message || 'Failed to mark all notifications as read'
    };
  }
};

// Delete a notification
export const deleteNotification = async (id) => {
  try {
    const response = await API.delete(`/notifications/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting notification ${id}:`, error);
    // Return a standardized error response
    return {
      status: 'error',
      message: error.response?.data?.message || 'Failed to delete notification'
    };
  }
};

// Delete all notifications
export const deleteAllNotifications = async () => {
  try {
    const response = await API.delete('/notifications/all');
    return response.data;
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    // Return a standardized error response
    return {
      status: 'error',
      message: error.response?.data?.message || 'Failed to delete all notifications'
    };
  }
};

// Format notification timestamp to relative time
export const formatNotificationTime = (timestamp) => {
  const now = new Date();
  const notificationTime = new Date(timestamp);
  const diffInSeconds = Math.floor((now - notificationTime) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks} week${diffInWeeks !== 1 ? 's' : ''} ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`;
};
