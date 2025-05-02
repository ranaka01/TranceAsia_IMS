const db = require('../db');

class Product {
  // Get all products with optional search and category filter
  static async findAll(search = '', category = '') {
    let query = `
      SELECT 
        p.Product_ID as id, 
        p.Title as title, 
        p.Category as category, 
        p.Warranty as warranty,
        i.Quantity as quantity,
        i.RetailPrice as retailPrice,
        o.SupplyPrice as supplyPrice,
        s.Supplier_ID as supplierId,
        s.Name as supplier
      FROM 
        product p
      LEFT JOIN 
        inventory i ON p.Product_ID = i.Product_ID
      LEFT JOIN 
        \`order\` o ON p.Product_ID = o.Product_ID
      LEFT JOIN 
        supplier s ON p.Supplier_ID = s.Supplier_ID
    `;
    
    let params = [];
    let conditions = [];
    
    // Add search functionality if search parameter is provided
    if (search) {
      conditions.push(`(p.Title LIKE ? OR p.Product_ID LIKE ?)`);
      params.push(`%${search}%`, `%${search}%`);
    }
    
    // Add category filter if category parameter is provided
    if (category && category !== 'All categories') {
      conditions.push(`p.Category = ?`);
      params.push(category);
    }
    
    // Add conditions to query if any
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
    
    query += ' ORDER BY p.Title ASC';
    
    try {
      const [rows] = await db.query(query, params);
      
      // Transform data to match frontend expectations
      return rows.map(row => ({
        id: row.id.toString(),
        title: row.title,
        category: row.category,
        warranty: row.warranty ? parseInt(row.warranty) : 0,
        quantity: row.quantity ? parseInt(row.quantity) : 0,
        supplyPrice: row.supplyPrice ? parseFloat(row.supplyPrice) : 0,
        retailPrice: row.retailPrice ? parseFloat(row.retailPrice) : 0,
        supplierId: row.supplierId,
        supplier: row.supplier
      }));
    } catch (error) {
      throw new Error(`Error fetching products: ${error.message}`);
    }
  }
  
  // Get a product by ID
  static async findById(id) {
    try {
      const [rows] = await db.query(
        `SELECT 
          p.Product_ID as id, 
          p.Title as title, 
          p.Category as category, 
          p.Warranty as warranty,
          i.Quantity as quantity,
          i.RetailPrice as retailPrice,
          o.SupplyPrice as supplyPrice,
          s.Supplier_ID as supplierId,
          s.Name as supplier
        FROM 
          product p
        LEFT JOIN 
          inventory i ON p.Product_ID = i.Product_ID
        LEFT JOIN 
          \`order\` o ON p.Product_ID = o.Product_ID
        LEFT JOIN 
          supplier s ON p.Supplier_ID = s.Supplier_ID
        WHERE 
          p.Product_ID = ?`,
        [id]
      );
      
      if (rows.length === 0) {
        return null;
      }
      
      const row = rows[0];
      return {
        id: row.id.toString(),
        title: row.title,
        category: row.category,
        warranty: row.warranty ? parseInt(row.warranty) : 0,
        quantity: row.quantity ? parseInt(row.quantity) : 0,
        supplyPrice: row.supplyPrice ? parseFloat(row.supplyPrice) : 0,
        retailPrice: row.retailPrice ? parseFloat(row.retailPrice) : 0,
        supplierId: row.supplierId,
        supplier: row.supplier
      };
    } catch (error) {
      throw new Error(`Error fetching product: ${error.message}`);
    }
  }
  
  // Get all product categories
  static async getCategories() {
    try {
      const [rows] = await db.query(
        `SELECT DISTINCT Category as category FROM product WHERE Category IS NOT NULL AND Category != ''`
      );
      
      // Always include 'All categories' as the first option
      return ['All categories', ...rows.map(row => row.category)];
    } catch (error) {
      throw new Error(`Error fetching categories: ${error.message}`);
    }
  }
  
  // Create a new product with inventory and supplier details
  static async create(productData) {
    try {
      const { title, category, warranty, quantity, supplyPrice, retailPrice, supplier } = productData;
      
      // Basic validation
      if (!title || !category || retailPrice === undefined || !supplier) {
        throw new Error('Required fields are missing');
      }
      
      // Start a transaction to ensure all operations succeed or fail together
      const connection = await db.getConnection();
      await connection.beginTransaction();
      
      try {
        // Get supplier ID
        const [supplierResult] = await connection.query(
          'SELECT Supplier_ID FROM supplier WHERE Name = ?',
          [supplier]
        );
        
        if (supplierResult.length === 0) {
          throw new Error(`Supplier "${supplier}" not found`);
        }
        
        const supplierId = supplierResult[0].Supplier_ID;
        
        // Insert into product table
        const [productResult] = await connection.query(
          `INSERT INTO product (Title, Category, Warranty, Supplier_ID)
           VALUES (?, ?, ?, ?)`,
          [title, category, warranty || null, supplierId]
        );
        
        const productId = productResult.insertId;
        
        // Insert into inventory table
        await connection.query(
          `INSERT INTO inventory (Category, Quantity, RetailPrice, Product_ID)
           VALUES (?, ?, ?, ?)`,
          [category, quantity || 0, retailPrice, productId]
        );
        
        // Insert into order table for supply price
        if (supplyPrice) {
          await connection.query(
            `INSERT INTO \`order\` (SupplyPrice, Quantity, Product_ID)
             VALUES (?, ?, ?)`,
            [supplyPrice, quantity || 0, productId]
          );
        }
        
        await connection.commit();
        connection.release();
        
        // Return the newly created product
        return this.findById(productId);
      } catch (error) {
        await connection.rollback();
        connection.release();
        throw error;
      }
    } catch (error) {
      throw new Error(`Error creating product: ${error.message}`);
    }
  }
  
  // Update a product and its associated details
  static async update(id, productData) {
    try {
      // Check if product exists
      const product = await this.findById(id);
      if (!product) {
        throw new Error('Product not found');
      }
      
      const { title, category, warranty, quantity, supplyPrice, retailPrice, supplier } = productData;
      
      // Basic validation
      if (!title || !category || retailPrice === undefined || !supplier) {
        throw new Error('Required fields are missing');
      }
      
      // Start a transaction
      const connection = await db.getConnection();
      await connection.beginTransaction();
      
      try {
        // Get supplier ID if supplier name is provided
        let supplierId = product.supplierId;
        
        if (supplier !== product.supplier) {
          const [supplierResult] = await connection.query(
            'SELECT Supplier_ID FROM supplier WHERE Name = ?',
            [supplier]
          );
          
          if (supplierResult.length === 0) {
            throw new Error(`Supplier "${supplier}" not found`);
          }
          
          supplierId = supplierResult[0].Supplier_ID;
        }
        
        // Update product table
        await connection.query(
          `UPDATE product 
           SET Title = ?, Category = ?, Warranty = ?, Supplier_ID = ?
           WHERE Product_ID = ?`,
          [title, category, warranty || null, supplierId, id]
        );
        
        // Update inventory table
        const [inventoryResult] = await connection.query(
          'SELECT Inventory_ID FROM inventory WHERE Product_ID = ?',
          [id]
        );
        
        if (inventoryResult.length > 0) {
          await connection.query(
            `UPDATE inventory 
             SET Category = ?, Quantity = ?, RetailPrice = ?
             WHERE Product_ID = ?`,
            [category, quantity || 0, retailPrice, id]
          );
        } else {
          await connection.query(
            `INSERT INTO inventory (Category, Quantity, RetailPrice, Product_ID)
             VALUES (?, ?, ?, ?)`,
            [category, quantity || 0, retailPrice, id]
          );
        }
        
        // Update order table for supply price
        const [orderResult] = await connection.query(
          'SELECT Order_ID FROM `order` WHERE Product_ID = ?',
          [id]
        );
        
        if (orderResult.length > 0) {
          await connection.query(
            `UPDATE \`order\` 
             SET SupplyPrice = ?, Quantity = ?
             WHERE Product_ID = ?`,
            [supplyPrice, quantity || 0, id]
          );
        } else if (supplyPrice) {
          await connection.query(
            `INSERT INTO \`order\` (SupplyPrice, Quantity, Product_ID)
             VALUES (?, ?, ?)`,
            [supplyPrice, quantity || 0, id]
          );
        }
        
        await connection.commit();
        connection.release();
        
        // Return the updated product
        return this.findById(id);
      } catch (error) {
        await connection.rollback();
        connection.release();
        throw error;
      }
    } catch (error) {
      throw new Error(`Error updating product: ${error.message}`);
    }
  }
  
  // Delete a product and its associated records
  static async delete(id) {
    try {
      // Check if product exists
      const product = await this.findById(id);
      if (!product) {
        throw new Error('Product not found');
      }
      
      // Start a transaction
      const connection = await db.getConnection();
      await connection.beginTransaction();
      
      try {
        // Check if product is referenced in repair_product table
        const [repairResult] = await connection.query(
          'SELECT COUNT(*) as count FROM repair_product WHERE Product_ID = ?',
          [id]
        );
        
        if (repairResult[0].count > 0) {
          throw new Error('Cannot delete product with associated repair records');
        }
        
        // Delete from order table first
        await connection.query('DELETE FROM `order` WHERE Product_ID = ?', [id]);
        
        // Delete from inventory table
        await connection.query('DELETE FROM inventory WHERE Product_ID = ?', [id]);
        
        // Finally delete the product
        await connection.query('DELETE FROM product WHERE Product_ID = ?', [id]);
        
        await connection.commit();
        connection.release();
        
        return true;
      } catch (error) {
        await connection.rollback();
        connection.release();
        throw error;
      }
    } catch (error) {
      throw new Error(`Error deleting product: ${error.message}`);
    }
  }
  
  // Add a new category
  static async addCategory(category) {
    try {
      // Check if category already exists
      const [existingCategories] = await db.query(
        'SELECT Category FROM product WHERE Category = ? LIMIT 1',
        [category]
      );
      
      if (existingCategories.length > 0) {
        throw new Error('Category already exists');
      }
      
      // We don't actually create a category separately in the database
      // Categories are just stored in the product table
      // So we'll return success
      return { category };
    } catch (error) {
      throw new Error(`Error adding category: ${error.message}`);
    }
  }
  
  // Update a category name (updates all products with that category)
  static async updateCategory(oldCategory, newCategory) {
    try {
      // Check if new category name already exists
      if (oldCategory !== newCategory) {
        const [existingCategories] = await db.query(
          'SELECT Category FROM product WHERE Category = ? LIMIT 1',
          [newCategory]
        );
        
        if (existingCategories.length > 0) {
          throw new Error('Category already exists');
        }
      }
      
      // Start a transaction
      const connection = await db.getConnection();
      await connection.beginTransaction();
      
      try {
        // Update category in product table
        await connection.query(
          'UPDATE product SET Category = ? WHERE Category = ?',
          [newCategory, oldCategory]
        );
        
        // Update category in inventory table
        await connection.query(
          'UPDATE inventory SET Category = ? WHERE Category = ?',
          [newCategory, oldCategory]
        );
        
        await connection.commit();
        connection.release();
        
        return { oldCategory, newCategory };
      } catch (error) {
        await connection.rollback();
        connection.release();
        throw error;
      }
    } catch (error) {
      throw new Error(`Error updating category: ${error.message}`);
    }
  }
  
  // Delete a category (removes category from all products with that category)
  static async deleteCategory(category) {
    try {
      // Check if products are using this category
      const [productCount] = await db.query(
        'SELECT COUNT(*) as count FROM product WHERE Category = ?',
        [category]
      );
      
      if (productCount[0].count > 0) {
        throw new Error('Cannot delete category that is in use by products');
      }
      
      return { category };
    } catch (error) {
      throw new Error(`Error deleting category: ${error.message}`);
    }
  }
}

module.exports = Product;