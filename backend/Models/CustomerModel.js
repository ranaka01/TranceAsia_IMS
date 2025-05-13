const db = require('../db');

class Customer {
  // Get all customers with optional search
  static async findAll(search = '') {
    let query = `
      SELECT 
        id, 
        name, 
        phone, 
        email, 
        DATE_FORMAT(date, '%Y-%m-%d') as dateCreated
      FROM 
        customers
    `;
    
    let params = [];
    
    // Add search functionality if search parameter is provided
    if (search) {
      query += `
        WHERE
          name LIKE ? OR 
          phone LIKE ? OR 
          email LIKE ?
      `;
      params = [`%${search}%`, `%${search}%`, `%${search}%`];
    }
    
    query += ' ORDER BY name ASC';
    
    try {
      const [rows] = await db.query(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching customers: ${error.message}`);
    }
  }
  
  // Get a customer by ID
  static async findById(id) {
    try {
      const [rows] = await db.query(
        `SELECT 
          id, 
          name, 
          phone, 
          email, 
          DATE_FORMAT(date, '%Y-%m-%d') as dateCreated
        FROM 
          customers 
        WHERE 
          id = ?`,
        [id]
      );
      
      return rows[0];
    } catch (error) {
      throw new Error(`Error fetching customer: ${error.message}`);
    }
  }
  
  // Find customer by phone number
  static async findByPhone(phone) {
    try {
      const [rows] = await db.query(
        `SELECT 
          id, 
          name, 
          phone, 
          email, 
          DATE_FORMAT(date, '%Y-%m-%d') as dateCreated
        FROM 
          customers 
        WHERE 
          phone = ?`,
        [phone]
      );
      
      return rows[0];
    } catch (error) {
      throw new Error(`Error fetching customer by phone: ${error.message}`);
    }
  }
  
  // Find customer by email
  static async findByEmail(email) {
    try {
      if (!email || email.trim() === '') {
        return null; // Empty email should return null (no duplicate)
      }
      
      const [rows] = await db.query(
        `SELECT 
          id, 
          name, 
          phone, 
          email, 
          DATE_FORMAT(date, '%Y-%m-%d') as dateCreated
        FROM 
          customers 
        WHERE 
          email = ?`,
        [email]
      );
      
      return rows[0];
    } catch (error) {
      throw new Error(`Error fetching customer by email: ${error.message}`);
    }
  }
  
  // Create a new customer
  static async create(customerData) {
    try {
      const { name, phone, email } = customerData;
      
      // Basic validation
      if (!name || !phone) {
        throw new Error('Name and phone number are required');
      }
      
      // Phone validation (Sri Lankan mobile number)
      const cleanPhone = phone.replace(/\s+/g, '');
      const phonePattern = /^(07\d{8}|\+947\d{8})$/;
      if (!phonePattern.test(cleanPhone)) {
        throw new Error('Invalid phone number format');
      }
      
      // Email validation (if provided)
      if (email && email.trim() !== '') {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
          throw new Error('Invalid email format');
        }
        
        // Check if email already exists
        const existingEmailCustomer = await this.findByEmail(email);
        if (existingEmailCustomer) {
          throw new Error('A customer with this email already exists');
        }
      }
      
      // Check if phone number already exists
      const existingCustomer = await this.findByPhone(phone);
      if (existingCustomer) {
        throw new Error('A customer with this phone number already exists');
      }
      
      const [result] = await db.query(
        `INSERT INTO customers 
          (name, phone, email, date)
        VALUES 
          (?, ?, ?, NOW())`,
        [name, phone, email || null]
      );
      
      const insertedId = result.insertId;
      return this.findById(insertedId);
    } catch (error) {
      throw new Error(`Error creating customer: ${error.message}`);
    }
  }
  
  // Update a customer
  static async update(id, customerData) {
    try {
      // Check if customer exists
      const customer = await this.findById(id);
      if (!customer) {
        throw new Error('Customer not found');
      }
      
      const { name, phone, email } = customerData;
      
      // Basic validation
      if (!name || !phone) {
        throw new Error('Name and phone number are required');
      }
      
      // Phone validation (Sri Lankan mobile number)
      const cleanPhone = phone.replace(/\s+/g, '');
      const phonePattern = /^(07\d{8}|\+947\d{8})$/;
      if (!phonePattern.test(cleanPhone)) {
        throw new Error('Invalid phone number format');
      }
      
      // Email validation (if provided)
      if (email && email.trim() !== '') {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
          throw new Error('Invalid email format');
        }
        
        // Check if email already exists for another customer
        const existingEmailCustomer = await this.findByEmail(email);
        if (existingEmailCustomer && existingEmailCustomer.id != id) {
          throw new Error('A customer with this email already exists');
        }
      }
      
      // Check if phone number already exists for another customer
      const existingCustomer = await this.findByPhone(phone);
      if (existingCustomer && existingCustomer.id != id) {
        throw new Error('A customer with this phone number already exists');
      }
      
      await db.query(
        `UPDATE customers 
        SET 
          name = ?, 
          phone = ?, 
          email = ?
        WHERE 
          id = ?`,
        [name, phone, email || null, id]
      );
      
      return this.findById(id);
    } catch (error) {
      throw new Error(`Error updating customer: ${error.message}`);
    }
  }
  
  // Delete a customer
  static async delete(id) {
    try {
      // Check if customer exists
      const customer = await this.findById(id);
      if (!customer) {
        throw new Error('Customer not found');
      }
      
      // Check if customer has associated sales
      const [sales] = await db.query(
        `SELECT COUNT(*) as count FROM sales WHERE customer_id = ?`,
        [id]
      );
      
      if (sales[0].count > 0) {
        throw new Error('Cannot delete customer with associated sales records');
      } else {
        // If no sales, we can delete
        await db.query('DELETE FROM customers WHERE id = ?', [id]);
      }
      
      return true;
    } catch (error) {
      throw new Error(`Error deleting customer: ${error.message}`);
    }
  }
}

module.exports = Customer;