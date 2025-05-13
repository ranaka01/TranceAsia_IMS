const db = require('../db');

class Supplier {
  // Get all suppliers with optional search
  static async findAll(search = '') {
    let query = `
      SELECT 
        supplier_id as id, 
        name, 
        shop_name, 
        phone, 
        email, 
        address,
        date,
        is_active
      FROM 
        suppliers
    `;
    
    let params = [];
    
    // Add search functionality if search parameter is provided
    if (search) {
      query += `
        WHERE 
          name LIKE ? OR 
          shop_name LIKE ? OR
          phone LIKE ? OR 
          email LIKE ? OR 
          address LIKE ?
      `;
      params = [
        `%${search}%`, 
        `%${search}%`, 
        `%${search}%`, 
        `%${search}%`, 
        `%${search}%`
      ];
    }
    
    query += ' ORDER BY name ASC';
    
    try {
      const [rows] = await db.query(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching suppliers: ${error.message}`);
    }
  }
  
  // Get a supplier by ID
  static async findById(id) {
    try {
      const [rows] = await db.query(
        `SELECT 
          supplier_id as id, 
          name, 
          shop_name,
          phone, 
          email, 
          address,
          date,
          is_active
        FROM 
          suppliers 
        WHERE 
          supplier_id = ?`,
        [id]
      );
      
      return rows[0];
    } catch (error) {
      throw new Error(`Error fetching supplier: ${error.message}`);
    }
  }
  
  // Create a new supplier
  static async create(supplierData) {
    try {
      const { name, shop_name, phone, email, address } = supplierData;
      
      // Basic validation
      if (!name || !shop_name || !phone || !email || !address) {
        throw new Error('All fields are required');
      }
      
      // Phone validation (Sri Lankan mobile number)
      const cleanPhone = phone.replace(/\s+/g, '');
      const phonePattern = /^(07\d{8}|\+947\d{8})$/;
      if (!phonePattern.test(cleanPhone)) {
        throw new Error('Invalid phone number format');
      }
      
      // Email validation
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email)) {
        throw new Error('Invalid email format');
      }
      
      // Current date for the "date" field
      const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      const [result] = await db.query(
        `INSERT INTO suppliers 
          (name, shop_name, phone, email, address, date, is_active)
        VALUES 
          (?, ?, ?, ?, ?, ?, ?)`,
        [name, shop_name, phone, email, address, currentDate, true]
      );
      
      const insertedId = result.insertId;
      return this.findById(insertedId);
    } catch (error) {
      throw new Error(`Error creating supplier: ${error.message}`);
    }
  }
  
  // Update a supplier
  static async update(id, supplierData) {
    try {
      // Check if supplier exists
      const supplier = await this.findById(id);
      if (!supplier) {
        throw new Error('Supplier not found');
      }
      
      // Build the update query dynamically based on provided fields
      const updateFields = [];
      const updateValues = [];
      
      // Check each field and add it to the update if provided
      if (supplierData.name !== undefined) {
        updateFields.push('name = ?');
        updateValues.push(supplierData.name);
      }
      
      if (supplierData.shop_name !== undefined) {
        updateFields.push('shop_name = ?');
        updateValues.push(supplierData.shop_name);
      }
      
      if (supplierData.phone !== undefined) {
        updateFields.push('phone = ?');
        updateValues.push(supplierData.phone);
        
        // Validate phone if provided
        if (supplierData.phone) {
          const cleanPhone = supplierData.phone.replace(/\s+/g, '');
          const phonePattern = /^(07\d{8}|\+947\d{8})$/;
          if (!phonePattern.test(cleanPhone)) {
            throw new Error('Invalid phone number format');
          }
        }
      }
      
      if (supplierData.email !== undefined) {
        updateFields.push('email = ?');
        updateValues.push(supplierData.email);
        
        // Validate email if provided
        if (supplierData.email) {
          const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailPattern.test(supplierData.email)) {
            throw new Error('Invalid email format');
          }
        }
      }
      
      if (supplierData.address !== undefined) {
        updateFields.push('address = ?');
        updateValues.push(supplierData.address);
      }
      
      // Handle is_active field separately (could be a boolean)
      if (supplierData.is_active !== undefined) {
        updateFields.push('is_active = ?');
        updateValues.push(supplierData.is_active ? 1 : 0);
      }
      
      // If no fields to update, return the existing supplier
      if (updateFields.length === 0) {
        return supplier;
      }
      
      // Add ID to values array for WHERE clause
      updateValues.push(id);
      
      const query = `
        UPDATE suppliers 
        SET ${updateFields.join(', ')}
        WHERE supplier_id = ?
      `;
      
      await db.query(query, updateValues);
      
      return this.findById(id);
    } catch (error) {
      throw new Error(`Error updating supplier: ${error.message}`);
    }
  }
  
  // Delete a supplier
  static async delete(id) {
    try {
      // Check if supplier exists
      const supplier = await this.findById(id);
      if (!supplier) {
        throw new Error('Supplier not found');
      }
      
      // Check if supplier is referenced by any products
      const [products] = await db.query(
        `SELECT COUNT(*) as count FROM product WHERE supplier_id = ?`,
        [id]
      );
      
      if (products[0].count > 0) {
        throw new Error('Cannot delete supplier with associated products');
      }
      
      await db.query('DELETE FROM suppliers WHERE supplier_id = ?', [id]);
      return true;
    } catch (error) {
      throw new Error(`Error deleting supplier: ${error.message}`);
    }
  }

  // Toggle supplier active status
  static async toggleStatus(id) {
    try {
      // Check if supplier exists
      const supplier = await this.findById(id);
      if (!supplier) {
        throw new Error('Supplier not found');
      }
      
      // Toggle the status
      const newStatus = supplier.is_active ? 0 : 1;
      
      await db.query(
        'UPDATE suppliers SET is_active = ? WHERE supplier_id = ?',
        [newStatus, id]
      );
      
      return this.findById(id);
    } catch (error) {
      throw new Error(`Error toggling supplier status: ${error.message}`);
    }
  }
}

module.exports = Supplier;