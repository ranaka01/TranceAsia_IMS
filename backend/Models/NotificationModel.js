const db = require('../db');
const websocketManager = require('../utils/websocketManager');

class Notification {
  // Get all notifications for a user with optional filters
  static async findAllForUser(userId, options = {}) {
    try {
      const { limit = 50, offset = 0, isRead, type } = options;

      console.log('Finding notifications for user:', userId);
      console.log('With options:', options);

      let query = `
        SELECT
          id,
          title,
          message,
          type,
          reference_id,
          reference_type,
          data,
          is_read,
          created_at,
          updated_at
        FROM
          notifications
      `;

      const params = [];

      // Start with a WHERE clause
      query += ` WHERE 1=1`; // Always true condition to simplify adding AND clauses

      // Add user filter if userId is provided
      if (userId) {
        query += ` AND (user_id = ? OR user_id IS NULL)`;
        params.push(userId);
      }

      // Add filter for read/unread notifications
      if (isRead !== undefined) {
        query += ` AND is_read = ?`;
        params.push(isRead ? 1 : 0);
      }

      // Add filter for notification type
      if (type) {
        query += ` AND type = ?`;
        params.push(type);
      }

      // Add order by and limit
      query += `
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `;
      params.push(limit, offset);

      console.log('Executing SQL query:', query);
      console.log('With parameters:', params);

      const [rows] = await db.query(query, params);

      console.log(`Query returned ${rows.length} rows`);

      const mappedRows = rows.map(row => {
        let parsedData = null;
        try {
          parsedData = row.data ? JSON.parse(row.data) : null;
        } catch (err) {
          console.error(`Error parsing data for notification ID ${row.id}:`, err);
          parsedData = { error: 'Invalid data format' };
        }

        // Keep both is_read (for frontend compatibility) and isRead (for API consistency)
        return {
          ...row,
          data: parsedData,
          isRead: row.is_read === 1
        };
      });

      console.log('Mapped rows sample:', mappedRows.length > 0 ? JSON.stringify(mappedRows[0], null, 2) : 'No notifications');

      return mappedRows;
    } catch (error) {
      console.error('Error in findAllForUser:', error);
      console.error('Error stack:', error.stack);
      throw new Error(`Error fetching notifications: ${error.message}`);
    }
  }

  // Get unread notification count for a user
  static async getUnreadCountForUser(userId) {
    try {
      let query = `
        SELECT COUNT(*) as count
        FROM notifications
        WHERE is_read = 0
      `;

      const params = [];

      // Add user filter if userId is provided
      if (userId) {
        query += ` AND (user_id = ? OR user_id IS NULL)`;
        params.push(userId);
      }

      const [rows] = await db.query(query, params);

      return rows[0].count;
    } catch (error) {
      throw new Error(`Error getting unread notification count: ${error.message}`);
    }
  }

  // Create a new notification
  static async create(notificationData) {
    try {
      const {
        userId,
        title,
        message,
        type = 'system',
        referenceId,
        referenceType,
        data
      } = notificationData;

      console.log('Creating notification in database with data:', {
        userId,
        title,
        message,
        type,
        referenceId,
        referenceType,
        data: data ? 'Data present (not shown)' : null
      });

      const query = `INSERT INTO notifications
        (user_id, title, message, type, reference_id, reference_type, data)
       VALUES
        (?, ?, ?, ?, ?, ?, ?)`;

      const params = [
        userId || null,
        title,
        message,
        type,
        referenceId || null,
        referenceType || null,
        data ? JSON.stringify(data) : null
      ];

      console.log('SQL Query:', query);
      console.log('SQL Params:', params);

      const [result] = await db.query(query, params);
      const notificationId = result.insertId;

      console.log('Notification created with ID:', notificationId);

      // Fetch the created notification to send via WebSocket
      const [notifications] = await db.query(
        `SELECT
          id, title, message, type, reference_id, reference_type,
          data, is_read, created_at, updated_at
        FROM notifications
        WHERE id = ?`,
        [notificationId]
      );

      if (notifications.length > 0) {
        const notification = notifications[0];

        // Parse data field if it exists
        if (notification.data) {
          try {
            notification.data = JSON.parse(notification.data);
          } catch (err) {
            console.error(`Error parsing data for notification ID ${notification.id}:`, err);
            notification.data = { error: 'Invalid data format' };
          }
        }

        // Add isRead property for consistency
        notification.isRead = notification.is_read === 1;

        // Send notification via WebSocket if userId is provided
        if (userId) {
          websocketManager.sendNotificationToUser(userId, notification);
        } else {
          // If no specific user, broadcast to all users
          websocketManager.broadcastNotification(notification);
        }
      }

      return notificationId;
    } catch (error) {
      console.error('Error details in create notification:', error);
      console.error('Error stack:', error.stack);
      throw new Error(`Error creating notification: ${error.message}`);
    }
  }

  // Mark a notification as read
  static async markAsRead(id, userId) {
    try {
      let query = `
        UPDATE notifications
        SET is_read = 1
        WHERE id = ?
      `;

      const params = [id];

      // Add user filter if userId is provided
      if (userId) {
        query += ` AND (user_id = ? OR user_id IS NULL)`;
        params.push(userId);
      }

      const [result] = await db.query(query, params);
      const success = result.affectedRows > 0;

      if (success && userId) {
        // Send notification update via WebSocket
        websocketManager.sendNotificationUpdateToUser(userId, {
          type: 'read',
          id,
          isRead: true
        });
      }

      return success;
    } catch (error) {
      throw new Error(`Error marking notification as read: ${error.message}`);
    }
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userId) {
    try {
      let query = `
        UPDATE notifications
        SET is_read = 1
        WHERE is_read = 0
      `;

      const params = [];

      // Add user filter if userId is provided
      if (userId) {
        query += ` AND (user_id = ? OR user_id IS NULL)`;
        params.push(userId);
      }

      const [result] = await db.query(query, params);
      const affectedRows = result.affectedRows;

      if (affectedRows > 0 && userId) {
        // Send notification update via WebSocket
        websocketManager.sendNotificationUpdateToUser(userId, {
          type: 'read_all',
          count: affectedRows,
          isRead: true
        });
      }

      return affectedRows;
    } catch (error) {
      throw new Error(`Error marking all notifications as read: ${error.message}`);
    }
  }

  // Delete a notification
  static async delete(id, userId) {
    try {
      let query = `
        DELETE FROM notifications
        WHERE id = ?
      `;

      const params = [id];

      // Add user filter if userId is provided
      if (userId) {
        query += ` AND (user_id = ? OR user_id IS NULL)`;
        params.push(userId);
      }

      const [result] = await db.query(query, params);
      const success = result.affectedRows > 0;

      if (success && userId) {
        // Send notification update via WebSocket
        websocketManager.sendNotificationUpdateToUser(userId, {
          type: 'delete',
          id
        });
      }

      return success;
    } catch (error) {
      throw new Error(`Error deleting notification: ${error.message}`);
    }
  }

  // Delete all notifications for a user
  static async deleteAll(userId) {
    try {
      let query = `DELETE FROM notifications`;
      const params = [];

      // Add user filter if userId is provided
      if (userId) {
        query += ` WHERE user_id = ? OR user_id IS NULL`;
        params.push(userId);
      }

      const [result] = await db.query(query, params);
      const affectedRows = result.affectedRows;

      if (affectedRows > 0 && userId) {
        // Send notification update via WebSocket
        websocketManager.sendNotificationUpdateToUser(userId, {
          type: 'delete_all',
          count: affectedRows
        });
      }

      return affectedRows;
    } catch (error) {
      throw new Error(`Error deleting all notifications: ${error.message}`);
    }
  }

  // Create a repair status change notification
  static async createRepairStatusNotification(repairData) {
    try {
      const {
        repairId,
        customer,
        deviceType,
        deviceModel,
        previousStatus,
        newStatus,
        technician
      } = repairData;

      // Use admin user ID (3) for all repair notifications
      // This ensures the foreign key constraint is satisfied
      const adminUserId = 3;

      const title = `Repair Status Updated`;
      const message = `Repair #${repairId} for ${customer} (${deviceType} ${deviceModel}) status changed from ${previousStatus} to ${newStatus}`;

      console.log('Creating repair notification with admin user ID:', adminUserId);

      return await this.create({
        userId: adminUserId, // Set the admin user ID
        title,
        message,
        type: 'repair',
        referenceId: repairId,
        referenceType: 'repair',
        data: {
          repairId,
          customer,
          deviceType,
          deviceModel,
          previousStatus,
          newStatus,
          technician,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in createRepairStatusNotification:', error);
      console.error('Error stack:', error.stack);
      throw new Error(`Error creating repair status notification: ${error.message}`);
    }
  }
}

module.exports = Notification;
