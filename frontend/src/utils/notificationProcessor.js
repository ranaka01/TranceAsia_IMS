/**
 * Process a notification to ensure it has all required fields and consistent format
 * @param {Object} notification - The notification object to process
 * @returns {Object} - The processed notification
 */
export const processNotification = (notification) => {
  console.log('Processing notification:', notification);
  
  // Create a copy to avoid mutating the original
  const processed = { ...notification };
  
  // Convert numeric is_read to boolean
  if (processed.is_read === 0 || processed.is_read === '0') {
    processed.is_read = false;
  } else if (processed.is_read === 1 || processed.is_read === '1') {
    processed.is_read = true;
  }
  
  // Ensure both is_read and isRead properties exist for compatibility
  if (processed.isRead !== undefined && processed.is_read === undefined) {
    processed.is_read = Boolean(processed.isRead);
  } else if (processed.is_read !== undefined && processed.isRead === undefined) {
    processed.isRead = Boolean(processed.is_read);
  } else if (processed.isRead === undefined && processed.is_read === undefined) {
    // Default to unread if neither property exists
    processed.is_read = false;
    processed.isRead = false;
  }

  // Handle data field if it's a string
  if (processed.data && typeof processed.data === 'string') {
    try {
      processed.data = JSON.parse(processed.data);
    } catch (err) {
      console.error('Error parsing notification data:', err);
      processed.data = { error: 'Invalid data format' };
    }
  }

  // Ensure message field exists
  if (!processed.message) {
    processed.message = processed.title || 'No message available';
  }
  
  console.log('Processed notification:', processed);
  return processed;
};

/**
 * Check if a notification is read
 * @param {Object} notification - The notification to check
 * @returns {boolean} - Whether the notification is read
 */
export const isNotificationRead = (notification) => {
  // Handle numeric values
  if (notification.is_read === 1 || notification.isRead === 1) {
    return true;
  }
  
  // Handle boolean values
  return Boolean(notification.is_read) || Boolean(notification.isRead);
};

export default {
  processNotification,
  isNotificationRead
};
