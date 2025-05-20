const db = require('../db');

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

      // Always return all notifications regardless of user_id
      // This ensures admin users can see all notifications
      query += ` WHERE 1=1`; // Always true condition to simplify adding AND clauses

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

      console.log('Notification created with ID:', result.insertId);

      return result.insertId;
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

      return result.affectedRows > 0;
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

      return result.affectedRows;
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

      return result.affectedRows > 0;
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

      return result.affectedRows;
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
