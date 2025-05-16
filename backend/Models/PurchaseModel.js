const db = require('../db');

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
}

module.exports = Purchase;
