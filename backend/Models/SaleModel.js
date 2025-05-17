const db = require('../db');
const { format } = require('date-fns');

// Function to check if sale_serials table exists
async function checkSaleSerialTable() {
  try {
    // Check if the sale_serials table exists
    const [tables] = await db.query(`
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'sale_serials'
    `);

    if (tables.length === 0) {
      console.error('sale_serials table does not exist!');

      // Create the table if it doesn't exist
      await db.query(`
        CREATE TABLE IF NOT EXISTS sale_serials (
          id INT AUTO_INCREMENT PRIMARY KEY,
          sale_id INT NOT NULL,
          serial_number VARCHAR(255) NOT NULL,
          FOREIGN KEY (sale_id) REFERENCES sales(sale_id) ON DELETE CASCADE
        )
      `);
      console.log('Created sale_serials table');
    } else {
      console.log('sale_serials table exists');

      // Check the structure of the table
      const [columns] = await db.query(`
        SHOW COLUMNS FROM sale_serials
      `);

      console.log('sale_serials table structure:', columns.map(c => `${c.Field} (${c.Type})`).join(', '));
    }
  } catch (error) {
    console.error('Error checking sale_serials table:', error);
  }
}

// Run the check when the module is loaded
checkSaleSerialTable();

class Sale {
  // Get all sales with filtering options
  static async findAll({ startDate, endDate, customerId, productId, page, limit, search }) {
    try {
      let query = `
        SELECT
          i.invoice_no as bill_no,
          i.date,
          GROUP_CONCAT(DISTINCT p.name SEPARATOR ', ') as items,
          c.name as customer_name,
          c.phone as customer_phone,
          u.Username as user_name,
          i.total
        FROM
          invoice i
        LEFT JOIN
          sales s ON i.invoice_no = s.invoice_no
        LEFT JOIN
          product p ON s.product_id = p.product_id
        LEFT JOIN
          customers c ON i.customer_id = c.id
        LEFT JOIN
          user u ON i.created_by = u.User_ID
      `;

      const conditions = [];
      const params = [];

      // Add filters
      if (startDate) {
        conditions.push('i.date >= ?');
        params.push(startDate);
      }

      if (endDate) {
        conditions.push('i.date <= ?');
        params.push(endDate);
      }

      if (customerId) {
        conditions.push('i.customer_id = ?');
        params.push(customerId);
      }

      if (productId) {
        conditions.push('s.product_id = ?');
        params.push(productId);
      }

      if (search) {
        conditions.push('(i.invoice_no LIKE ? OR c.name LIKE ? OR p.name LIKE ? OR c.phone LIKE ?)');
        const searchParam = `%${search}%`;
        params.push(searchParam, searchParam, searchParam, searchParam);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      // Group by invoice number
      query += ' GROUP BY i.invoice_no';

      // Order by newest first
      query += ' ORDER BY i.date DESC';

      // Get count without pagination
      const [countResult] = await db.query(
        `SELECT COUNT(DISTINCT i.invoice_no) as total FROM invoice i
         LEFT JOIN sales s ON i.invoice_no = s.invoice_no
         LEFT JOIN product p ON s.product_id = p.product_id
         LEFT JOIN customers c ON i.customer_id = c.id
         ${conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''}`,
        params
      );

      const totalCount = countResult[0].total;
      const totalPages = Math.ceil(totalCount / limit);

      // Add pagination
      query += ' LIMIT ? OFFSET ?';
      params.push(limit, (page - 1) * limit);

      const [rows] = await db.query(query, params);

      return {
        sales: rows,
        totalCount,
        totalPages
      };
    } catch (error) {
      throw new Error(`Error fetching sales: ${error.message}`);
    }
  }

  // Get a sale by ID with its items
  static async findById(id) {
    try {
      // Get sale header information
      const [invoice] = await db.query(
        `SELECT
          i.invoice_no as bill_no,
          i.date,
          i.total,
          i.payment_method,
          c.id as customer_id,
          c.name as customer_name,
          c.phone as customer_phone,
          c.email as customer_email,
          u.Username as user_name
        FROM
          invoice i
        LEFT JOIN
          customers c ON i.customer_id = c.id
        LEFT JOIN
          user u ON i.created_by = u.User_ID
        WHERE
          i.invoice_no = ?`,
        [id]
      );

      if (invoice.length === 0) {
        return null;
      }

      // Get sale items
      const [items] = await db.query(
        `SELECT
          s.sale_id,
          p.product_id,
          p.name as product_name,
          pu.warranty,
          s.quantity,
          s.serial_no,
          pu.selling_price as unit_price,
          s.discount,
          (s.quantity * pu.selling_price * (1 - s.discount/100)) as total
        FROM
          sales s
        JOIN
          product p ON s.product_id = p.product_id
        JOIN
          purchases pu ON s.purchase_id = pu.purchase_id
        WHERE
          s.invoice_no = ?`,
        [id]
      );

      console.log(`Found ${items.length} items for sale #${id}`);

      // Get serial numbers for each sale item
      for (const item of items) {
        try {
          // Log the sale_id to help with debugging
          console.log(`Fetching serial numbers for sale_id: ${item.sale_id}`);

          const [serials] = await db.query(
            `SELECT serial_number
             FROM sale_serials
             WHERE sale_id = ?`,
            [item.sale_id]
          );

          console.log(`Found ${serials.length} serial numbers for sale_id: ${item.sale_id}`);

          // Add serial_numbers array to the item
          item.serial_numbers = serials.map(s => s.serial_number);

          // Log the serial numbers for debugging
          console.log('Serial numbers:', item.serial_numbers);
        } catch (serialError) {
          console.error(`Error fetching serial numbers for sale_id ${item.sale_id}:`, serialError);
          item.serial_numbers = []; // Set default empty array if there's an error
        }
      }

      // Calculate subtotal, discount amount, etc.
      const subtotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
      const discountAmount = items.reduce((sum, item) => sum + (item.unit_price * item.quantity * (item.discount / 100)), 0);

      const result = {
        ...invoice[0],
        subtotal,
        discount: discountAmount,
        items
      };

      console.log('Final sale data with serial numbers:', JSON.stringify(result, null, 2));

      return result;
    } catch (error) {
      console.error(`Error fetching sale: ${error.message}`);
      throw new Error(`Error fetching sale: ${error.message}`);
    }
  }

  // Create a new sale with items
   static async create({ customer_id, items, payment_method, amount_paid, change_amount, created_by }) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Calculate total
      let total = 0;
      for (const item of items) {
        const [purchase] = await connection.query(
          'SELECT selling_price FROM purchases WHERE purchase_id = ?',
          [item.purchase_id]
        );
        if (purchase.length === 0) throw new Error(`Purchase with ID ${item.purchase_id} not found`);
        const itemTotal = purchase[0].selling_price * item.quantity * (1 - (item.discount || 0) / 100);
        total += itemTotal;
      }

      // Create invoice
      const today = format(new Date(), 'yyyy-MM-dd HH:mm:ss'); // date with time
      const [invoiceResult] = await connection.query(
        `INSERT INTO invoice (customer_id, date, total, created_by, payment_method)
         VALUES (?, ?, ?, ?, ?)`,
        [customer_id, today, total, created_by, payment_method]
      );
      const invoiceNo = invoiceResult.insertId;

      // Add sale items and serials
      for (const item of items) {
        // Insert sale item
        const [salesResult] = await connection.query(
          `INSERT INTO sales
            (product_id, purchase_id, quantity, date, serial_no, customer_id, discount, invoice_no)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            item.product_id,
            item.purchase_id,
            item.quantity,
            today,
            null, // serial_no field now unused, replaced by sale_serials table
            customer_id,
            item.discount || 0,
            invoiceNo
          ]
        );
        const saleId = salesResult.insertId;

        // Insert serial numbers if provided
        if (item.serial_numbers && Array.isArray(item.serial_numbers)) {
          console.log(`Saving ${item.serial_numbers.length} serial numbers for sale_id ${saleId}`);

          for (const serial of item.serial_numbers) {
            if (serial && serial.trim() !== '') {
              try {
                const [result] = await connection.query(
                  `INSERT INTO sale_serials (sale_id, serial_number) VALUES (?, ?)`,
                  [saleId, serial]
                );
                console.log(`Saved serial number: ${serial} for sale_id ${saleId}, insert ID: ${result.insertId}`);
              } catch (serialError) {
                console.error(`Error saving serial number ${serial} for sale_id ${saleId}:`, serialError);
              }
            }
          }
        } else {
          console.log(`No serial numbers to save for sale_id ${saleId}`);
        }

        // Update remaining quantity in purchases
        await connection.query(
          `UPDATE purchases SET remaining_quantity = remaining_quantity - ? WHERE purchase_id = ?`,
          [item.quantity, item.purchase_id]
        );
      }

      await connection.commit();
      return this.findById(invoiceNo);
    } catch (error) {
      await connection.rollback();
      throw new Error(`Error creating sale: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  // Update sale information
  static async update(id, updateData) {
    try {
      const { payment_method, payment_status, notes } = updateData;

      const [result] = await db.query(
        `UPDATE invoice
         SET
          payment_method = IFNULL(?, payment_method),
          payment_status = IFNULL(?, payment_status),
          notes = IFNULL(?, notes)
         WHERE invoice_no = ?`,
        [payment_method, payment_status, notes, id]
      );

      if (result.affectedRows === 0) {
        throw new Error('Sale not found');
      }

      return this.findById(id);
    } catch (error) {
      throw new Error(`Error updating sale: ${error.message}`);
    }
  }

  // Check if a sale can be deleted
  static async canDelete(id) {
    try {
      // Check if there are warranty claims associated with the sale
      const [warrantyResults] = await db.query(
        'SELECT COUNT(*) as count FROM warranty_claims WHERE sale_id IN (SELECT sale_id FROM sales WHERE invoice_no = ?)',
        [id]
      );

      if (warrantyResults[0].count > 0) {
        return {
          success: false,
          message: 'Cannot delete sale with associated warranty claims'
        };
      }

      // Check if the sale is recent (e.g., within 24 hours)
      const [saleResults] = await db.query(
        'SELECT date FROM invoice WHERE invoice_no = ?',
        [id]
      );

      if (saleResults.length === 0) {
        return {
          success: false,
          message: 'Sale not found'
        };
      }

      const saleDate = new Date(saleResults[0].date);
      const currentDate = new Date();
      const diffInHours = (currentDate - saleDate) / (1000 * 60 * 60);

      if (diffInHours > 24) {
        return {
          success: false,
          message: 'Cannot delete sales older than 24 hours'
        };
      }

      return {
        success: true
      };
    } catch (error) {
      throw new Error(`Error checking if sale can be deleted: ${error.message}`);
    }
  }

  // Delete a sale and its items
  static async delete(id) {
    // Use a transaction to ensure data consistency
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Get sale items to restore quantities
      const [items] = await connection.query(
        'SELECT product_id, purchase_id, quantity FROM sales WHERE invoice_no = ?',
        [id]
      );

      // Restore quantities in purchases
      for (const item of items) {
        await connection.query(
          `UPDATE purchases
           SET remaining_quantity = remaining_quantity + ?
           WHERE purchase_id = ?`,
          [item.quantity, item.purchase_id]
        );
      }

      // Get all sale_ids for this invoice
      const [saleIds] = await connection.query(
        'SELECT sale_id FROM sales WHERE invoice_no = ?',
        [id]
      );

      // Delete serial numbers for each sale
      for (const { sale_id } of saleIds) {
        console.log(`Deleting serial numbers for sale_id: ${sale_id}`);
        await connection.query('DELETE FROM sale_serials WHERE sale_id = ?', [sale_id]);
      }

      // Delete sale items
      await connection.query('DELETE FROM sales WHERE invoice_no = ?', [id]);

      // Delete invoice
      await connection.query('DELETE FROM invoice WHERE invoice_no = ?', [id]);

      // Commit the transaction
      await connection.commit();

      return true;
    } catch (error) {
      // Rollback the transaction on error
      await connection.rollback();
      throw new Error(`Error deleting sale: ${error.message}`);
    } finally {
      connection.release();
    }
  }
}

module.exports = Sale;