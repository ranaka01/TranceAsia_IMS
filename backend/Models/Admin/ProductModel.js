const db = require('../../db');

class Product {
  // Get all products with optional search and category filter
  static async findAll(search = '', categoryId = '') {
    try {
      let query = `
        SELECT 
          p.product_id as id, 
          p.name as title,
          p.details,
          c.category_id as categoryId,
          c.name as category, 
          s.supplier_id as supplierId,
          s.name as supplier,
          s.shop_name as shopName
        FROM 
          product p
        LEFT JOIN 
          category c ON p.category_id = c.category_id
        LEFT JOIN 
          suppliers s ON p.supplier_id = s.supplier_id
      `;
      
      let params = [];
      let conditions = [];
      
      // Add search functionality if search parameter is provided
      if (search) {
        conditions.push(`(p.name LIKE ? OR p.product_id LIKE ?)`);
        params.push(`%${search}%`, `%${search}%`);
      }
      
      // Add category filter if categoryId parameter is provided
      if (categoryId && categoryId !== '' && categoryId !== 'all') {
        conditions.push(`p.category_id = ?`);
        params.push(categoryId);
      }
      
      // Add conditions to query if any
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      query += ' ORDER BY p.name ASC';
      
      const [rows] = await db.query(query, params);
      
      // Transform data to match frontend expectations
      return rows.map(row => ({
        id: row.id.toString(),
        title: row.title,
        details: row.details || "",
        categoryId: row.categoryId,
        category: row.category || "Uncategorized", // Provide fallback for NULL categories
        supplierId: row.supplierId,
        supplier: row.supplier,
        shopName: row.shopName || ""
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
          p.product_id as id, 
          p.name as title, 
          p.details,
          c.category_id as categoryId,
          c.name as category, 
          s.supplier_id as supplierId,
          s.name as supplier,
          s.shop_name as shopName
        FROM 
          product p
        LEFT JOIN 
          category c ON p.category_id = c.category_id
        LEFT JOIN 
          suppliers s ON p.supplier_id = s.supplier_id
        WHERE 
          p.product_id = ?`,
        [id]
      );
      
      if (rows.length === 0) {
        return null;
      }
      
      const row = rows[0];
      return {
        id: row.id.toString(),
        title: row.title,
        details: row.details || "",
        categoryId: row.categoryId,
        category: row.category || "Uncategorized", // Provide fallback for NULL categories
        supplierId: row.supplierId,
        supplier: row.supplier,
        shopName: row.shopName || ""
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
          await db.query('INSERT INTO category (name) VALUES (?)', [category]);
        }
      }
      
      const [rows] = await db.query(
        `SELECT category_id as id, name FROM category ORDER BY name ASC`
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
        'SELECT category_id FROM category WHERE name = ? LIMIT 1',
        [categoryName]
      );
      
      if (existingCategories.length > 0) {
        throw new Error('Category already exists');
      }
      
      // Insert new category
      const [result] = await db.query(
        'INSERT INTO category (name) VALUES (?)',
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
        'SELECT category_id FROM category WHERE name = ? LIMIT 1',
        [oldCategoryName]
      );
      
      if (category.length === 0) {
        throw new Error('Category not found');
      }
      
      const categoryId = category[0].category_id;
      
      // Check if the new name already exists for another category
      const [existingCategory] = await db.query(
        'SELECT category_id FROM category WHERE name = ? AND category_id != ? LIMIT 1',
        [newCategoryName, categoryId]
      );
      
      if (existingCategory.length > 0) {
        throw new Error('Category name already exists');
      }
      
      // Update category name
      await db.query(
        'UPDATE category SET name = ? WHERE category_id = ?',
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
        'SELECT category_id FROM category WHERE name = ? LIMIT 1',
        [categoryName]
      );
      
      if (category.length === 0) {
        throw new Error('Category not found');
      }
      
      const categoryId = category[0].category_id;
      
      // Check if products are using this category
      const [productCount] = await db.query(
        'SELECT COUNT(*) as count FROM product WHERE category_id = ?',
        [categoryId]
      );
      
      if (productCount[0].count > 0) {
        throw new Error('Cannot delete category that is in use by products');
      }
      
      // Delete the category
      await db.query('DELETE FROM category WHERE category_id = ?', [categoryId]);
      
      return { 
        id: categoryId.toString(), 
        name: categoryName 
      };
    } catch (error) {
      console.error(`Error deleting category: ${error.message}`);
      throw new Error(`Error deleting category: ${error.message}`);
    }
  }
  
  // Create a new product with details field
  static async create(productData) {
    try {
      const { title, category, supplier, details } = productData;
      
      // Required fields validation
      if (!title) {
        throw new Error('Product title is required');
      }
      
      if (!category) {
        throw new Error('Category is required');
      }
      
      if (!supplier) {
        throw new Error('Supplier is required');
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
            'SELECT category_id FROM category WHERE name = ? LIMIT 1',
            [category]
          );
          
          if (categoryResult.length === 0) {
            // If category doesn't exist, create it
            const [newCategory] = await connection.query(
              'INSERT INTO category (name) VALUES (?)',
              [category]
            );
            categoryId = newCategory.insertId;
          } else {
            categoryId = categoryResult[0].category_id;
          }
        }
        
        // Get supplier ID if provided
        let supplierId = supplier;
        
        // If supplier is a string name rather than an ID, look up the supplier
        if (isNaN(parseInt(supplier))) {
          const [supplierResult] = await connection.query(
            'SELECT supplier_id FROM suppliers WHERE name = ? LIMIT 1',
            [supplier]
          );
          
          if (supplierResult.length === 0) {
            throw new Error('Supplier not found');
          }
          
          supplierId = supplierResult[0].supplier_id;
        }
        
        // Insert into product table with details
        const [productResult] = await connection.query(
          `INSERT INTO product (name, category_id, supplier_id, details)
           VALUES (?, ?, ?, ?)`,
          [title, categoryId, supplierId, details || null]
        );
        
        const productId = productResult.insertId;
        
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
  
  // Update a product - Modified to support partial updates and details field
  static async update(id, productData) {
    try {
      // Check if product exists
      const product = await this.findById(id);
      if (!product) {
        throw new Error('Product not found');
      }
      
      console.log("Update data received:", productData);
      
      // Extract data including details
      const { title, category, supplier, details } = productData;
      
      // Start a transaction
      const connection = await db.getConnection();
      await connection.beginTransaction();
      
      try {
        // Get category ID (use existing if not provided)
        let categoryId = category || product.categoryId;
        
        // If category is a string name rather than an ID, look up or create the category
        if (isNaN(parseInt(categoryId))) {
          const [categoryResult] = await connection.query(
            'SELECT category_id FROM category WHERE name = ? LIMIT 1',
            [categoryId]
          );
          
          if (categoryResult.length === 0) {
            // If category doesn't exist, create it
            const [newCategory] = await connection.query(
              'INSERT INTO category (name) VALUES (?)',
              [categoryId]
            );
            categoryId = newCategory.insertId;
          } else {
            categoryId = categoryResult[0].category_id;
          }
        }
        
        // Get supplier ID (use existing if not provided)
        let supplierId = supplier || product.supplierId;
        
        // If supplier is a string name rather than an ID, look up the supplier
        if (isNaN(parseInt(supplierId))) {
          const [supplierResult] = await connection.query(
            'SELECT supplier_id FROM suppliers WHERE name = ? LIMIT 1',
            [supplierId]
          );
          
          if (supplierResult.length === 0) {
            throw new Error('Supplier not found');
          }
          
          supplierId = supplierResult[0].supplier_id;
        }
        
        // Get the final title (use existing if not provided)
        const finalTitle = title || product.title;
        
        // Update product table including details field - Handle partial updates
        let updateQuery;
        let updateParams;
        
        if (details !== undefined) {
          // If details is provided, update it
          updateQuery = `
            UPDATE product 
            SET name = ?, category_id = ?, supplier_id = ?, details = ?
            WHERE product_id = ?
          `;
          updateParams = [finalTitle, categoryId, supplierId, details, id];
        } else {
          // If details is not provided, don't update it
          updateQuery = `
            UPDATE product 
            SET name = ?, category_id = ?, supplier_id = ?
            WHERE product_id = ?
          `;
          updateParams = [finalTitle, categoryId, supplierId, id];
        }
        
        await connection.query(updateQuery, updateParams);
        
        await connection.commit();
        connection.release();
        
        // Return the updated product
        return this.findById(id);
      } catch (error) {
        console.error("Transaction error:", error);
        await connection.rollback();
        connection.release();
        throw error;
      }
    } catch (error) {
      console.error(`Error updating product: ${error.message}`);
      throw new Error(`Error updating product: ${error.message}`);
    }
  }
  
  // Delete a product
  static async delete(id) {
    try {
      // Check if product exists
      const product = await this.findById(id);
      if (!product) {
        throw new Error('Product not found');
      }
      
      // Check if the product is referenced by any other tables
      const [inventoryResult] = await db.query(
        'SELECT COUNT(*) as count FROM inventory WHERE product_id = ?',
        [id]
      );
      
      const [purchasesResult] = await db.query(
        'SELECT COUNT(*) as count FROM purchases WHERE product_id = ?',
        [id]
      );
      
      const [salesResult] = await db.query(
        'SELECT COUNT(*) as count FROM sales WHERE product_id = ?',
        [id]
      );
      
      // If the product is referenced by any of these tables, don't allow deletion
      if (inventoryResult[0].count > 0 || purchasesResult[0].count > 0 || salesResult[0].count > 0) {
        throw new Error('Cannot delete product because it is referenced by other records');
      }
      
      // Delete the product
      await db.query('DELETE FROM product WHERE product_id = ?', [id]);
      
      return true;
    } catch (error) {
      console.error(`Error deleting product: ${error.message}`);
      throw new Error(`Error deleting product: ${error.message}`);
    }
  }
}

module.exports = Product;
