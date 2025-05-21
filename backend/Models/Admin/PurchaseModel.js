const db = require('../../db');

class Purchase {
  // Get all purchases with remaining stock information
  static async findAll(search = '') {
    let query = `
      SELECT
        p.purchase_id,
        p.product_id,
        pr.name as product_name,
        s.name as supplier_name,
        p.quantity,
        p.remaining_quantity,
        p.warranty,
        p.buying_price,
        p.selling_price,
        p.date,
        COALESCE(p.quantity - IFNULL(SUM(sl.quantity), 0), p.quantity) as remaining_stock
      FROM
        purchases p
      LEFT JOIN
        product pr ON p.product_id = pr.product_id
      LEFT JOIN
        suppliers s ON pr.supplier_id = s.supplier_id
      LEFT JOIN
        sales sl ON p.purchase_id = sl.purchase_id
    `;
    let params = [];
    if (search) {
      query += `
        WHERE
          pr.name LIKE ? OR
          s.name LIKE ?
      `;
      params = [`%${search}%`, `%${search}%`];
    }
    query += `
      GROUP BY
        p.purchase_id
      ORDER BY
        p.date DESC, p.purchase_id DESC
    `;
    try {
      const [rows] = await db.query(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching purchases: ${error.message}`);
    }
  }

  // Get a purchase by ID with remaining stock information
  static async findById(id) {
    try {
      const [rows] = await db.query(
        `SELECT
          p.purchase_id,
          p.product_id,
          pr.name as product_name,
          s.name as supplier_name,
          p.quantity,
          p.remaining_quantity,
          p.warranty,
          p.buying_price,
          p.selling_price,
          p.date,
          COALESCE(p.quantity - IFNULL(SUM(sl.quantity), 0), p.quantity) as remaining_stock
        FROM
          purchases p
        LEFT JOIN
          product pr ON p.product_id = pr.product_id
        LEFT JOIN
          suppliers s ON pr.supplier_id = s.supplier_id
        LEFT JOIN
          sales sl ON p.purchase_id = sl.purchase_id
        WHERE
          p.purchase_id = ?
        GROUP BY
          p.purchase_id`,
        [id]
      );
      return rows[0];
    } catch (error) {
      throw new Error(`Error fetching purchase: ${error.message}`);
    }
  }

  // Create a new purchase with remaining_quantity
  static async create(purchaseData) {
    try {
      const { product_id, quantity, warranty, buying_price, selling_price, date } = purchaseData;

      if (!product_id) throw new Error('Product ID is required');
      if (!quantity || isNaN(parseInt(quantity)) || parseInt(quantity) <= 0) throw new Error('Quantity must be a positive number');
      if (!buying_price || isNaN(parseFloat(buying_price)) || parseFloat(buying_price) <= 0) throw new Error('Buying price must be a positive number');
      if (!selling_price || isNaN(parseFloat(selling_price)) || parseFloat(selling_price) <= 0) throw new Error('Selling price must be a positive number');
      if (!date) throw new Error('Date is required');

      // Check if product exists
      const [productResults] = await db.query(
        `SELECT product_id FROM product WHERE product_id = ?`,
        [product_id]
      );
      if (productResults.length === 0) throw new Error(`Product with ID ${product_id} not found`);

      // Set remaining_quantity to quantity at creation
      const remaining_quantity = parseInt(quantity);

      const purchaseValues = [
        parseInt(product_id),
        parseInt(quantity),
        remaining_quantity,
        warranty,
        parseFloat(buying_price),
        parseFloat(selling_price),
        date
      ];

      const [result] = await db.query(
        `INSERT INTO purchases
          (product_id, quantity, remaining_quantity, warranty, buying_price, selling_price, date)
        VALUES
          (?, ?, ?, ?, ?, ?, ?)`,
        purchaseValues
      );

      if (!result || !result.insertId) throw new Error('Failed to insert purchase record');
      const insertedId = result.insertId;

      // Update inventory in the database
      await this.updateInventory(product_id);

      // Fetch and return the created purchase
      return await this.findById(insertedId);
    } catch (error) {
      throw new Error(`Error creating purchase: ${error.message}`);
    }
  }

  // Update a purchase (optionally update remaining_quantity if needed)
  static async update(id, purchaseData) {
    try {
      // Check if purchase exists
      const purchase = await this.findById(id);
      if (!purchase) throw new Error('Purchase not found');

      // Check if has related sales
      const [sales] = await db.query(
        `SELECT COUNT(*) as count FROM sales WHERE purchase_id = ?`,
        [id]
      );
      if (sales[0].count > 0) throw new Error('Cannot update purchase with associated sales');

      const { quantity, warranty, buying_price, selling_price, date } = purchaseData;

      if (!quantity || isNaN(parseInt(quantity)) || parseInt(quantity) <= 0) throw new Error('Quantity must be a positive number');
      if (!buying_price || isNaN(parseFloat(buying_price)) || parseFloat(buying_price) <= 0) throw new Error('Buying price must be a positive number');
      if (!selling_price || isNaN(parseFloat(selling_price)) || parseFloat(selling_price) <= 0) throw new Error('Selling price must be a positive number');
      if (!date) throw new Error('Date is required');

      // Optionally, also update remaining_quantity to match new quantity
      const remaining_quantity = parseInt(quantity);

      await db.query(
        `UPDATE purchases
        SET
          quantity = ?,
          remaining_quantity = ?,
          warranty = ?,
          buying_price = ?,
          selling_price = ?,
          date = ?
        WHERE
          purchase_id = ?`,
        [
          parseInt(quantity),
          remaining_quantity,
          warranty,
          parseFloat(buying_price),
          parseFloat(selling_price),
          date,
          id
        ]
      );

      await this.updateInventory(purchase.product_id);

      return this.findById(id);
    } catch (error) {
      throw new Error(`Error updating purchase: ${error.message}`);
    }
  }

  // Delete a purchase - Only allowed if no sales have been made against it
  static async delete(id) {
    try {
      const purchase = await this.findById(id);
      if (!purchase) throw new Error('Purchase not found');

      const [sales] = await db.query(
        `SELECT COUNT(*) as count FROM sales WHERE purchase_id = ?`,
        [id]
      );
      if (sales[0].count > 0) throw new Error('Cannot delete purchase with associated sales');

      const [result] = await db.query('DELETE FROM purchases WHERE purchase_id = ?', [id]);
      if (result.affectedRows === 0) throw new Error('Failed to delete purchase record');

      await this.updateInventory(purchase.product_id);
      return true;
    } catch (error) {
      throw new Error(`Error deleting purchase: ${error.message}`);
    }
  }

  // Update inventory levels for a product based on purchases and sales
  static async updateInventory(productId) {
    try {
      const [productCheck] = await db.query(
        `SELECT product_id FROM product WHERE product_id = ?`,
        [productId]
      );
      if (productCheck.length === 0) throw new Error(`Product with ID ${productId} not found when updating inventory`);

      const [purchasedResult] = await db.query(
        `SELECT COALESCE(SUM(quantity), 0) as total_purchased
         FROM purchases
         WHERE product_id = ?`,
        [productId]
      );
      const [soldResult] = await db.query(
        `SELECT COALESCE(SUM(s.quantity), 0) as total_sold
         FROM sales s
         JOIN purchases p ON s.purchase_id = p.purchase_id
         WHERE p.product_id = ?`,
        [productId]
      );
      const totalPurchased = purchasedResult[0].total_purchased;
      const totalSold = soldResult[0].total_sold;
      const currentStock = totalPurchased - totalSold;

      const [inventoryExists] = await db.query(
        `SELECT inventory_id FROM inventory WHERE product_id = ?`,
        [productId]
      );
      if (inventoryExists.length > 0) {
        await db.query(
          `UPDATE inventory
           SET stock_quantity = ?, last_updated = CURRENT_TIMESTAMP
           WHERE product_id = ?`,
          [currentStock, productId]
        );
      } else {
        await db.query(
          `INSERT INTO inventory (product_id, stock_quantity) VALUES (?, ?)`,
          [productId, currentStock]
        );
      }
      return true;
    } catch (error) {
      throw new Error(`Error updating inventory: ${error.message}`);
    }
  }

  // Get purchases with available stock (remaining stock > 0) for a specific product
  static async findAvailableStockByProduct(productId) {
    try {
      const [rows] = await db.query(
        `SELECT
          p.purchase_id,
          p.product_id,
          pr.name as product_name,
          p.quantity,
          p.remaining_quantity,
          p.warranty,
          p.buying_price,
          p.selling_price,
          p.date,
          COALESCE(p.quantity - IFNULL(SUM(sl.quantity), 0), p.quantity) as remaining_stock
        FROM
          purchases p
        LEFT JOIN
          product pr ON p.product_id = pr.product_id
        LEFT JOIN
          sales sl ON p.purchase_id = sl.purchase_id
        WHERE
          p.product_id = ?
        GROUP BY
          p.purchase_id
        HAVING
          remaining_stock > 0
        ORDER BY
          p.date ASC, p.purchase_id ASC`,
        [productId]
      );
      return rows;
    } catch (error) {
      throw new Error(`Error finding available stock: ${error.message}`);
    }
  }

  // Find the most recent purchase
  static async findLastPurchase(userId) {
    try {
      // Get the most recent purchase
      const [rows] = await db.query(
        `SELECT
          p.purchase_id,
          p.product_id,
          pr.name as product_name,
          s.supplier_id,
          s.name as supplier_name,
          p.quantity,
          p.remaining_quantity,
          p.warranty,
          p.buying_price,
          p.selling_price,
          p.date
        FROM
          purchases p
        JOIN
          product pr ON p.product_id = pr.product_id
        JOIN
          suppliers s ON pr.supplier_id = s.supplier_id
        ORDER BY
          p.purchase_id DESC
        LIMIT 1`
      );

      if (rows.length === 0) {
        return null;
      }

      return rows[0];
    } catch (error) {
      throw new Error(`Error finding last purchase: ${error.message}`);
    }
  }

  // Check if a purchase can be undone
  static async canUndo(purchaseId) {
    try {
      // Check if purchase exists
      const purchase = await this.findById(purchaseId);
      if (!purchase) {
        return {
          success: false,
          message: 'Purchase not found'
        };
      }

      // Check if there are any sales associated with this purchase
      const [sales] = await db.query(
        `SELECT COUNT(*) as count FROM sales WHERE purchase_id = ?`,
        [purchaseId]
      );

      if (sales[0].count > 0) {
        return {
          success: false,
          message: 'Cannot undo purchase with associated sales'
        };
      }

      // Check if the purchase is recent (e.g., within 24 hours)
      const [purchaseResults] = await db.query(
        'SELECT date FROM purchases WHERE purchase_id = ?',
        [purchaseId]
      );

      if (purchaseResults.length === 0) {
        return {
          success: false,
          message: 'Purchase not found'
        };
      }

      return {
        success: true
      };
    } catch (error) {
      throw new Error(`Error checking if purchase can be undone: ${error.message}`);
    }
  }

  // Ensure purchase_undo_logs table exists
  static async ensureUndoLogsTableExists() {
    try {
      // Check if the table exists
      const [tables] = await db.query(`
        SELECT TABLE_NAME
        FROM INFORMATION_SCHEMA.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'purchase_undo_logs'
      `);

      if (tables.length === 0) {
        console.log('Creating purchase_undo_logs table...');

        // Create the table if it doesn't exist
        await db.query(`
          CREATE TABLE IF NOT EXISTS purchase_undo_logs (
            log_id INT AUTO_INCREMENT PRIMARY KEY,
            purchase_id INT NOT NULL,
            product_id INT NOT NULL,
            quantity INT NOT NULL,
            buying_price DECIMAL(10,2) NOT NULL,
            supplier_id INT NOT NULL,
            date_purchased DATETIME NOT NULL,
            date_undone DATETIME DEFAULT CURRENT_TIMESTAMP,
            undone_by VARCHAR(50) NOT NULL,
            reason VARCHAR(255),
            KEY product_id (product_id),
            KEY supplier_id (supplier_id),
            CONSTRAINT purchase_undo_logs_ibfk_1 FOREIGN KEY (product_id) REFERENCES product(product_id) ON DELETE CASCADE,
            CONSTRAINT purchase_undo_logs_ibfk_2 FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE CASCADE
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
        `);

        console.log('purchase_undo_logs table created successfully');
      } else {
        console.log('purchase_undo_logs table already exists');

        // Check if the table has the required columns
        const [columns] = await db.query(`
          SHOW COLUMNS FROM purchase_undo_logs
        `);

        console.log('purchase_undo_logs table structure:', columns.map(c => `${c.Field} (${c.Type})`).join(', '));

        // Check if the table has the purchase_id foreign key constraint
        const [constraints] = await db.query(`
          SELECT CONSTRAINT_NAME
          FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
          WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'purchase_undo_logs'
          AND COLUMN_NAME = 'purchase_id'
          AND REFERENCED_TABLE_NAME = 'purchases'
        `);

        // If the constraint exists, drop it
        if (constraints.length > 0) {
          console.log('Dropping purchase_id foreign key constraint...');

          // Get the constraint name
          const constraintName = constraints[0].CONSTRAINT_NAME;

          // Drop the constraint
          await db.query(`
            ALTER TABLE purchase_undo_logs
            DROP FOREIGN KEY ${constraintName}
          `);

          console.log('Foreign key constraint dropped successfully');
        }
      }

      return true;
    } catch (error) {
      console.error('Error ensuring purchase_undo_logs table exists:', error);
      throw new Error(`Error ensuring purchase_undo_logs table exists: ${error.message}`);
    }
  }

  // Undo the last purchase
  static async undoLastPurchase(purchaseId, username, reason) {
    // Use a transaction to ensure data consistency
    const connection = await db.getConnection();
    try {
      // Ensure the undo logs table exists
      await this.ensureUndoLogsTableExists();

      await connection.beginTransaction();

      // Get purchase details before deleting
      const [purchaseDetails] = await connection.query(
        `SELECT
          p.purchase_id,
          p.product_id,
          pr.supplier_id,
          p.quantity,
          p.buying_price,
          p.date
        FROM
          purchases p
        JOIN
          product pr ON p.product_id = pr.product_id
        WHERE
          p.purchase_id = ?`,
        [purchaseId]
      );

      if (purchaseDetails.length === 0) {
        throw new Error('Purchase not found');
      }

      const purchase = purchaseDetails[0];

      console.log('Purchase details before undoing:', purchase);

      // Log the undo action in purchase_undo_logs BEFORE deleting the purchase
      const [logResult] = await connection.query(
        `INSERT INTO purchase_undo_logs
          (purchase_id, product_id, quantity, buying_price, supplier_id, date_purchased, undone_by, reason)
        VALUES
          (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          purchase.purchase_id,
          purchase.product_id,
          purchase.quantity,
          purchase.buying_price,
          purchase.supplier_id,
          purchase.date,
          username,
          reason || null
        ]
      );

      console.log('Log inserted with ID:', logResult.insertId);

      // Then, delete the purchase
      const [deleteResult] = await connection.query(
        'DELETE FROM purchases WHERE purchase_id = ?',
        [purchaseId]
      );

      console.log('Purchase deleted, affected rows:', deleteResult.affectedRows);

      // Update inventory for the product
      await connection.query(
        `UPDATE inventory
        SET
          stock_quantity = stock_quantity - ?,
          last_updated = CURRENT_TIMESTAMP
        WHERE
          product_id = ?`,
        [purchase.quantity, purchase.product_id]
      );

      // Commit the transaction
      await connection.commit();

      return true;
    } catch (error) {
      // Rollback the transaction on error
      await connection.rollback();
      console.error('Error in undoLastPurchase:', error);
      throw new Error(`Error undoing purchase: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  // Get purchase undo logs
  static async getPurchaseUndoLogs(options = {}) {
    try {
      const { page = 1, limit = 10, search = '', startDate, endDate, forExport = false } = options;
      const offset = (page - 1) * limit;

      console.log('getPurchaseUndoLogs called with options:', options);

      let query = `
        SELECT
          l.log_id,
          l.purchase_id,
          l.product_id,
          p.name as product_name,
          s.name as supplier_name,
          l.quantity,
          l.buying_price,
          l.date_purchased,
          l.date_undone,
          l.undone_by,
          l.reason
        FROM
          purchase_undo_logs l
        JOIN
          product p ON l.product_id = p.product_id
        JOIN
          suppliers s ON l.supplier_id = s.supplier_id
      `;

      const whereConditions = [];
      const params = [];

      if (search) {
        whereConditions.push(`(p.name LIKE ? OR s.name LIKE ? OR l.undone_by LIKE ?)`);
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      if (startDate) {
        whereConditions.push(`l.date_undone >= ?`);
        params.push(startDate);
      }

      if (endDate) {
        whereConditions.push(`l.date_undone <= ?`);
        params.push(endDate);
      }

      if (whereConditions.length > 0) {
        query += ` WHERE ${whereConditions.join(' AND ')}`;
      }

      query += `
        ORDER BY
          l.date_undone DESC
      `;

      if (!forExport) {
        query += ` LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), offset);
      }

      console.log('Query:', query);
      console.log('Params:', params);

      const [rows] = await db.query(query, params);

      console.log(`Found ${rows.length} purchase undo logs`);

      // Get total count for pagination
      let countQuery = `
        SELECT
          COUNT(*) as total
        FROM
          purchase_undo_logs l
        JOIN
          product p ON l.product_id = p.product_id
        JOIN
          suppliers s ON l.supplier_id = s.supplier_id
      `;

      if (whereConditions.length > 0) {
        countQuery += ` WHERE ${whereConditions.join(' AND ')}`;
      }

      const countParams = params.slice(0, params.length - (forExport ? 0 : 2));
      const [countResult] = await db.query(countQuery, countParams);
      const totalCount = countResult[0].total;
      const totalPages = Math.ceil(totalCount / limit);

      return {
        logs: rows,
        totalCount,
        totalPages,
        currentPage: parseInt(page)
      };
    } catch (error) {
      console.error('Error in getPurchaseUndoLogs:', error);
      throw new Error(`Error fetching purchase undo logs: ${error.message}`);
    }
  }
}

module.exports = Purchase;
