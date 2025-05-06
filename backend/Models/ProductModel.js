const db = require('../db');

class Product {
  // Get all products with optional search and category filter
  static async findAll(search = '', categoryId = '') {
    try {
      let query = `
        SELECT 
          p.Product_ID as id, 
          p.Title as title, 
          c.Category_ID as categoryId,
          c.Name as category, 
          p.Warranty as warranty,
          i.Quantity as quantity,
          i.RetailPrice as retailPrice,
          o.SupplyPrice as supplyPrice,
          s.Supplier_ID as supplierId,
          s.Name as supplier
        FROM 
          product p
        LEFT JOIN 
          category c ON p.Category_ID = c.Category_ID
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
      
      // Add category filter if categoryId parameter is provided
      if (categoryId && categoryId !== '' && categoryId !== 'all') {
        conditions.push(`p.Category_ID = ?`);
        params.push(categoryId);
      }
      
      // Add conditions to query if any
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      query += ' ORDER BY p.Title ASC';
      
      const [rows] = await db.query(query, params);
      
      // Transform data to match frontend expectations
      return rows.map(row => ({
        id: row.id.toString(),
        title: row.title,
        categoryId: row.categoryId,
        category: row.category || "Uncategorized", // Provide fallback for NULL categories
        warranty: row.warranty ? parseInt(row.warranty) : 0,
        quantity: row.quantity ? parseInt(row.quantity) : 0,
        supplyPrice: row.supplyPrice ? parseFloat(row.supplyPrice) : 0,
        retailPrice: row.retailPrice ? parseFloat(row.retailPrice) : 0,
        supplierId: row.supplierId,
        supplier: row.supplier
      }));
    } catch (error) {
      console.error(`Error fetching products: ${error.message}`);
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
          c.Category_ID as categoryId,
          c.Name as category, 
          p.Warranty as warranty,
          i.Quantity as quantity,
          i.RetailPrice as retailPrice,
          o.SupplyPrice as supplyPrice,
          s.Supplier_ID as supplierId,
          s.Name as supplier
        FROM 
          product p
        LEFT JOIN 
          category c ON p.Category_ID = c.Category_ID
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
        categoryId: row.categoryId,
        category: row.category || "Uncategorized", // Provide fallback for NULL categories
        warranty: row.warranty ? parseInt(row.warranty) : 0,
        quantity: row.quantity ? parseInt(row.quantity) : 0,
        supplyPrice: row.supplyPrice ? parseFloat(row.supplyPrice) : 0,
        retailPrice: row.retailPrice ? parseFloat(row.retailPrice) : 0,
        supplierId: row.supplierId,
        supplier: row.supplier
      };
    } catch (error) {
      console.error(`Error fetching product: ${error.message}`);
      throw new Error(`Error fetching product: ${error.message}`);
    }
  }
  
  // Get all product categories
  static async getCategories() {
    try {
      // First check if the category table has any data
      const [categoryCount] = await db.query(
        "SELECT COUNT(*) as count FROM category"
      );
      
      // If no categories exist yet, add default ones
      if (categoryCount[0].count === 0) {
        console.log("No categories found, adding default categories");
        
        const defaultCategories = [
          'Laptop/Desktop',
          'Hardware',
          'Peripherals',
          'Mobile Devices',
          'Networking',
          'Storage',
          'Accessories'
        ];
        
        for (const category of defaultCategories) {
          await db.query('INSERT INTO category (Name) VALUES (?)', [category]);
        }
      }
      
      const [rows] = await db.query(
        `SELECT Category_ID as id, Name as name FROM category ORDER BY Name ASC`
      );
      
      // Transform data for frontend
      return [
        { id: 'all', name: 'All categories' },
        ...rows.map(row => ({ id: row.id.toString(), name: row.name }))
      ];
    } catch (error) {
      console.error(`Error fetching categories: ${error.message}`);
      return [{ id: 'all', name: 'All categories' }];
    }
  }
  
  // Add a new category
  static async addCategory(categoryName) {
    try {
      // Check if category already exists
      const [existingCategories] = await db.query(
        'SELECT Category_ID FROM category WHERE Name = ? LIMIT 1',
        [categoryName]
      );
      
      if (existingCategories.length > 0) {
        throw new Error('Category already exists');
      }
      
      // Insert new category
      const [result] = await db.query(
        'INSERT INTO category (Name) VALUES (?)',
        [categoryName]
      );
      
      return { 
        id: result.insertId.toString(), 
        name: categoryName 
      };
    } catch (error) {
      console.error(`Error adding category: ${error.message}`);
      throw new Error(`Error adding category: ${error.message}`);
    }
  }
  
  // Update a category name
  static async updateCategory(oldCategoryName, newCategoryName) {
    try {
      // Find category ID from old name
      const [category] = await db.query(
        'SELECT Category_ID FROM category WHERE Name = ? LIMIT 1',
        [oldCategoryName]
      );
      
      if (category.length === 0) {
        throw new Error('Category not found');
      }
      
      const categoryId = category[0].Category_ID;
      
      // Check if the new name already exists for another category
      const [existingCategory] = await db.query(
        'SELECT Category_ID FROM category WHERE Name = ? AND Category_ID != ? LIMIT 1',
        [newCategoryName, categoryId]
      );
      
      if (existingCategory.length > 0) {
        throw new Error('Category name already exists');
      }
      
      // Update category name
      await db.query(
        'UPDATE category SET Name = ? WHERE Category_ID = ?',
        [newCategoryName, categoryId]
      );
      
      return { 
        id: categoryId.toString(), 
        oldName: oldCategoryName, 
        newName: newCategoryName 
      };
    } catch (error) {
      console.error(`Error updating category: ${error.message}`);
      throw new Error(`Error updating category: ${error.message}`);
    }
  }
  
  // Delete a category
  static async deleteCategory(categoryName) {
    try {
      // Find category ID from name
      const [category] = await db.query(
        'SELECT Category_ID FROM category WHERE Name = ? LIMIT 1',
        [categoryName]
      );
      
      if (category.length === 0) {
        throw new Error('Category not found');
      }
      
      const categoryId = category[0].Category_ID;
      
      // Check if products are using this category
      const [productCount] = await db.query(
        'SELECT COUNT(*) as count FROM product WHERE Category_ID = ?',
        [categoryId]
      );
      
      if (productCount[0].count > 0) {
        throw new Error('Cannot delete category that is in use by products');
      }
      
      // Delete the category
      await db.query('DELETE FROM category WHERE Category_ID = ?', [categoryId]);
      
      return { 
        id: categoryId.toString(), 
        name: categoryName 
      };
    } catch (error) {
      console.error(`Error deleting category: ${error.message}`);
      throw new Error(`Error deleting category: ${error.message}`);
    }
  }
  
  // Create a new product
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
        // Get category ID
        let categoryId = category;
        
        // If category is a string name rather than an ID, look up or create the category
        if (isNaN(parseInt(category))) {
          const [categoryResult] = await connection.query(
            'SELECT Category_ID FROM category WHERE Name = ? LIMIT 1',
            [category]
          );
          
          if (categoryResult.length === 0) {
            // If category doesn't exist, create it
            const [newCategory] = await connection.query(
              'INSERT INTO category (Name) VALUES (?)',
              [category]
            );
            categoryId = newCategory.insertId;
          } else {
            categoryId = categoryResult[0].Category_ID;
          }
        }
        
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
          `INSERT INTO product (Title, Category_ID, Warranty, Supplier_ID)
           VALUES (?, ?, ?, ?)`,
          [title, categoryId, warranty || null, supplierId]
        );
        
        const productId = productResult.insertId;
        
        // Insert into inventory table
        await connection.query(
          `INSERT INTO inventory (Category_ID, Quantity, RetailPrice, Product_ID)
           VALUES (?, ?, ?, ?)`,
          [categoryId, quantity || 0, retailPrice, productId]
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
      console.error(`Error creating product: ${error.message}`);
      throw new Error(`Error creating product: ${error.message}`);
    }
  }
  
  // Update a product
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
        // Get category ID
        let categoryId = category;
        
        // If category is a string name rather than an ID, look up or create the category
        if (isNaN(parseInt(category))) {
          const [categoryResult] = await connection.query(
            'SELECT Category_ID FROM category WHERE Name = ? LIMIT 1',
            [category]
          );
          
          if (categoryResult.length === 0) {
            // If category doesn't exist, create it
            const [newCategory] = await connection.query(
              'INSERT INTO category (Name) VALUES (?)',
              [category]
            );
            categoryId = newCategory.insertId;
          } else {
            categoryId = categoryResult[0].Category_ID;
          }
        }
        
        // Get supplier ID
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
           SET Title = ?, Category_ID = ?, Warranty = ?, Supplier_ID = ?
           WHERE Product_ID = ?`,
          [title, categoryId, warranty || null, supplierId, id]
        );
        
        // Update inventory table
        const [inventoryResult] = await connection.query(
          'SELECT Inventory_ID FROM inventory WHERE Product_ID = ?',
          [id]
        );
        
        if (inventoryResult.length > 0) {
          await connection.query(
            `UPDATE inventory 
             SET Category_ID = ?, Quantity = ?, RetailPrice = ?
             WHERE Product_ID = ?`,
            [categoryId, quantity || 0, retailPrice, id]
          );
        } else {
          await connection.query(
            `INSERT INTO inventory (Category_ID, Quantity, RetailPrice, Product_ID)
             VALUES (?, ?, ?, ?)`,
            [categoryId, quantity || 0, retailPrice, id]
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
      console.error(`Error updating product: ${error.message}`);
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
      console.error(`Error deleting product: ${error.message}`);
      throw new Error(`Error deleting product: ${error.message}`);
    }
  }
}

module.exports = Product;