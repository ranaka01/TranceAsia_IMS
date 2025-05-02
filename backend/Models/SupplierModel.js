const db = require('../db');

class Supplier {
  // Get all suppliers with optional search
  static async findAll(search = '') {
    let query = `
      SELECT 
        Supplier_ID as id, 
        Name as name, 
        Category as category, 
        Phone as phone, 
        Email as email, 
        Address as address
      FROM 
        supplier
    `;
    
    let params = [];
    
    // Add search functionality if search parameter is provided
    if (search) {
      query += `
        WHERE 
          Name LIKE ? OR 
          Phone LIKE ? OR 
          Email LIKE ? OR 
          Category LIKE ?
      `;
      params = [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`];
    }
    
    query += ' ORDER BY Name ASC';
    
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
          Supplier_ID as id, 
          Name as name, 
          Category as category, 
          Phone as phone, 
          Email as email, 
          Address as address
        FROM 
          supplier 
        WHERE 
          Supplier_ID = ?`,
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
      const { name, category, phone, email, address } = supplierData;
      
      // Basic validation
      if (!name || !category || !phone || !email || !address) {
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
      
      const [result] = await db.query(
        `INSERT INTO supplier 
          (Name, Category, Phone, Email, Address)
        VALUES 
          (?, ?, ?, ?, ?)`,
        [name, category, phone, email, address]
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
      
      const { name, category, phone, email, address } = supplierData;
      
      // Basic validation
      if (!name || !category || !phone || !email || !address) {
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
      
      await db.query(
        `UPDATE supplier 
        SET 
          Name = ?, 
          Category = ?, 
          Phone = ?, 
          Email = ?, 
          Address = ?
        WHERE 
          Supplier_ID = ?`,
        [name, category, phone, email, address, id]
      );
      
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
        `SELECT COUNT(*) as count FROM product WHERE Supplier_ID = ?`,
        [id]
      );
      
      if (products[0].count > 0) {
        throw new Error('Cannot delete supplier with associated products');
      }
      
      await db.query('DELETE FROM supplier WHERE Supplier_ID = ?', [id]);
      return true;
    } catch (error) {
      throw new Error(`Error deleting supplier: ${error.message}`);
    }
  }
}

module.exports = Supplier;