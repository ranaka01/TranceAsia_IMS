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
    
    // Add search functionality if search parameter is provided
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
      console.log("Fetched purchases:", rows);
      return rows;
    } catch (error) {
      console.error("Error fetching purchases:", error);
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
      console.error("Error fetching purchase by ID:", error);
      throw new Error(`Error fetching purchase: ${error.message}`);
    }
  }
  
  // MODIFIED: Create a new purchase with enhanced validation and logging
  static async create(purchaseData) {
    console.log("Creating purchase with data:", purchaseData);
    
    try {
      const { product_id, quantity, warranty, buying_price, selling_price, date } = purchaseData;
      
      // Validate required fields
      if (!product_id) {
        throw new Error('Product ID is required');
      }
      
      if (!quantity || isNaN(parseInt(quantity)) || parseInt(quantity) <= 0) {
        throw new Error('Quantity must be a positive number');
      }
      
      if (!buying_price || isNaN(parseFloat(buying_price)) || parseFloat(buying_price) <= 0) {
        throw new Error('Buying price must be a positive number');
      }
      
      if (!selling_price || isNaN(parseFloat(selling_price)) || parseFloat(selling_price) <= 0) {
        throw new Error('Selling price must be a positive number');
      }
      
      if (!date) {
        throw new Error('Date is required');
      }

      // Check if product exists
      const [productResults] = await db.query(
        `SELECT product_id, name FROM product WHERE product_id = ?`,
        [product_id]
      );
      
      console.log("Product lookup results:", productResults);
      
      if (productResults.length === 0) {
        throw new Error(`Product with ID ${product_id} not found`);
      }
      
      // Log the product name for debugging
      console.log(`Found product: ${productResults[0].name} (ID: ${productResults[0].product_id})`);
      
      // Insert purchase record with explicit type conversion
      const purchaseValues = [
        parseInt(product_id),
        parseInt(quantity),
        warranty,
        parseFloat(buying_price),
        parseFloat(selling_price),
        date
      ];
      
      console.log("Inserting purchase with values:", purchaseValues);
      
      const [result] = await db.query(
        `INSERT INTO purchases 
          (product_id, quantity, warranty, buying_price, selling_price, date)
        VALUES 
          (?, ?, ?, ?, ?, ?)`,
        purchaseValues
      );
      
      console.log("Insert result:", result);
      
      if (!result || !result.insertId) {
        throw new Error('Failed to insert purchase record');
      }
      
      const insertedId = result.insertId;
      
      // Update inventory in the database
      await this.updateInventory(product_id);
      
      // Fetch and return the created purchase
      const createdPurchase = await this.findById(insertedId);
      console.log("Created and fetched purchase:", createdPurchase);
      
      return createdPurchase;
    } catch (error) {
      console.error("Error in Purchase.create:", error);
      throw new Error(`Error creating purchase: ${error.message}`);
    }
  }
  
  // Update a purchase - Only allowed if no sales have been made against it
  static async update(id, purchaseData) {
    try {
      // Check if purchase exists
      const purchase = await this.findById(id);
      if (!purchase) {
        throw new Error('Purchase not found');
      }
      
      // Check if has related sales
      const [sales] = await db.query(
        `SELECT COUNT(*) as count FROM sales WHERE purchase_id = ?`,
        [id]
      );
      
      if (sales[0].count > 0) {
        throw new Error('Cannot update purchase with associated sales');
      }
      
      const { quantity, warranty, buying_price, selling_price, date } = purchaseData;
      
      // Validate required fields
      if (!quantity || isNaN(parseInt(quantity)) || parseInt(quantity) <= 0) {
        throw new Error('Quantity must be a positive number');
      }
      
      if (!buying_price || isNaN(parseFloat(buying_price)) || parseFloat(buying_price) <= 0) {
        throw new Error('Buying price must be a positive number');
      }
      
      if (!selling_price || isNaN(parseFloat(selling_price)) || parseFloat(selling_price) <= 0) {
        throw new Error('Selling price must be a positive number');
      }
      
      if (!date) {
        throw new Error('Date is required');
      }
      
      await db.query(
        `UPDATE purchases 
        SET 
          quantity = ?, 
          warranty = ?, 
          buying_price = ?, 
          selling_price = ?,
          date = ?
        WHERE 
          purchase_id = ?`,
        [
          parseInt(quantity), 
          warranty, 
          parseFloat(buying_price), 
          parseFloat(selling_price), 
          date, 
          id
        ]
      );
      
      // Update inventory
      await this.updateInventory(purchase.product_id);
      
      return this.findById(id);
    } catch (error) {
      console.error("Error updating purchase:", error);
      throw new Error(`Error updating purchase: ${error.message}`);
    }
  }
  
  // Delete a purchase - Only allowed if no sales have been made against it
  static async delete(id) {
    try {
      // Check if purchase exists
      const purchase = await this.findById(id);
      if (!purchase) {
        throw new Error('Purchase not found');
      }
      
      // Check if has related sales
      const [sales] = await db.query(
        `SELECT COUNT(*) as count FROM sales WHERE purchase_id = ?`,
        [id]
      );
      
      if (sales[0].count > 0) {
        throw new Error('Cannot delete purchase with associated sales');
      }
      
      const [result] = await db.query('DELETE FROM purchases WHERE purchase_id = ?', [id]);
      
      if (result.affectedRows === 0) {
        throw new Error('Failed to delete purchase record');
      }
      
      // Update inventory
      await this.updateInventory(purchase.product_id);
      
      return true;
    } catch (error) {
      console.error("Error deleting purchase:", error);
      throw new Error(`Error deleting purchase: ${error.message}`);
    }
  }
  
  // MODIFIED: Update inventory levels for a product based on purchases and sales
  static async updateInventory(productId) {
    console.log(`Updating inventory for product ID: ${productId}`);
    
    try {
      // Check if product exists
      const [productCheck] = await db.query(
        `SELECT product_id FROM product WHERE product_id = ?`,
        [productId]
      );
      
      if (productCheck.length === 0) {
        throw new Error(`Product with ID ${productId} not found when updating inventory`);
      }
      
      // Calculate total quantity purchased
      const [purchasedResult] = await db.query(
        `SELECT COALESCE(SUM(quantity), 0) as total_purchased 
         FROM purchases 
         WHERE product_id = ?`,
        [productId]
      );
      
      // Calculate total quantity sold
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
      
      console.log(`Total purchased: ${totalPurchased}, Total sold: ${totalSold}, Current stock: ${currentStock}`);
      
      // Check if an inventory record exists for this product
      const [inventoryExists] = await db.query(
        `SELECT inventory_id FROM inventory WHERE product_id = ?`,
        [productId]
      );
      
      if (inventoryExists.length > 0) {
        // Update existing inventory record
        console.log(`Updating existing inventory record for product ID: ${productId}`);
        
        const [updateResult] = await db.query(
          `UPDATE inventory 
           SET stock_quantity = ?, last_updated = CURRENT_TIMESTAMP 
           WHERE product_id = ?`,
          [currentStock, productId]
        );
        
        console.log(`Inventory update result: ${updateResult.affectedRows} row(s) affected`);
      } else {
        // Create new inventory record
        console.log(`Creating new inventory record for product ID: ${productId}`);
        
        const [insertResult] = await db.query(
          `INSERT INTO inventory (product_id, stock_quantity)
           VALUES (?, ?)`,
          [productId, currentStock]
        );
        
        console.log(`Inventory insert result: ${insertResult.affectedRows} row(s) affected`);
      }
      
      return true;
    } catch (error) {
      console.error("Error updating inventory:", error);
      throw new Error(`Error updating inventory: ${error.message}`);
    }
  }
  
  // Get purchases with available stock (remaining stock > 0) for a specific product
  // Used when selling items to apply FIFO logic
  static async findAvailableStockByProduct(productId) {
    try {
      const [rows] = await db.query(
        `SELECT 
          p.purchase_id,
          p.product_id,
          pr.name as product_name,
          p.quantity,
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
      console.error("Error finding available stock:", error);
      throw new Error(`Error finding available stock: ${error.message}`);
    }
  }
}

module.exports = Purchase;