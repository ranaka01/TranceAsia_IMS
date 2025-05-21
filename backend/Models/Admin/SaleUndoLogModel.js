const db = require('../../db');

class SaleUndoLog {
  // Create a new undo log entry
  static async create(invoiceNo, userId, reasonType, reasonDetails, saleData) {
    try {
      // Convert sale data to JSON string if it's an object
      const saleDataJson = typeof saleData === 'object' 
        ? JSON.stringify(saleData) 
        : saleData;
      
      const [result] = await db.query(
        `INSERT INTO sale_undo_logs 
          (invoice_no, user_id, reason_type, reason_details, sale_data) 
         VALUES (?, ?, ?, ?, ?)`,
        [invoiceNo, userId, reasonType, reasonDetails, saleDataJson]
      );
      
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating undo log: ${error.message}`);
    }
  }
  
  // Get all undo logs with optional filtering
  static async findAll({ startDate, endDate, userId, reasonType, page = 1, limit = 50 }) {
    try {
      let query = `
        SELECT
          ul.id,
          ul.invoice_no,
          ul.user_id,
          u.Username as user_name,
          ul.undo_date,
          ul.reason_type,
          ul.reason_details,
          ul.sale_data
        FROM
          sale_undo_logs ul
        LEFT JOIN
          user u ON ul.user_id = u.User_ID
      `;
      
      const conditions = [];
      const params = [];
      
      // Add filters
      if (startDate) {
        conditions.push('ul.undo_date >= ?');
        params.push(startDate);
      }
      
      if (endDate) {
        conditions.push('ul.undo_date <= ?');
        params.push(endDate);
      }
      
      if (userId) {
        conditions.push('ul.user_id = ?');
        params.push(userId);
      }
      
      if (reasonType) {
        conditions.push('ul.reason_type = ?');
        params.push(reasonType);
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      // Order by newest first
      query += ' ORDER BY ul.undo_date DESC';
      
      // Get count without pagination
      const [countResult] = await db.query(
        `SELECT COUNT(*) as total FROM sale_undo_logs ul
         ${conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''}`,
        params
      );
      
      const totalCount = countResult[0].total;
      const totalPages = Math.ceil(totalCount / limit);
      
      // Add pagination
      query += ' LIMIT ? OFFSET ?';
      params.push(limit, (page - 1) * limit);
      
      const [rows] = await db.query(query, params);
      
      // Parse JSON data
      const logs = rows.map(row => ({
        ...row,
        sale_data: JSON.parse(row.sale_data)
      }));
      
      return {
        logs,
        totalCount,
        totalPages,
        currentPage: page,
        limit
      };
    } catch (error) {
      throw new Error(`Error fetching undo logs: ${error.message}`);
    }
  }
  
  // Get a specific undo log by ID
  static async findById(id) {
    try {
      const [rows] = await db.query(
        `SELECT
          ul.id,
          ul.invoice_no,
          ul.user_id,
          u.Username as user_name,
          ul.undo_date,
          ul.reason_type,
          ul.reason_details,
          ul.sale_data
        FROM
          sale_undo_logs ul
        LEFT JOIN
          user u ON ul.user_id = u.User_ID
        WHERE
          ul.id = ?`,
        [id]
      );
      
      if (rows.length === 0) {
        return null;
      }
      
      // Parse JSON data
      return {
        ...rows[0],
        sale_data: JSON.parse(rows[0].sale_data)
      };
    } catch (error) {
      throw new Error(`Error fetching undo log: ${error.message}`);
    }
  }
}

module.exports = SaleUndoLog;
