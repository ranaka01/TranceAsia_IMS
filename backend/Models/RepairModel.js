const db = require('../db');

class Repair {
  // Get all repairs with optional search
  static async findAll(search = '') {
    let query = `
      SELECT
        r.repair_id,
        r.customer_id,
        c.name as customer_name,
        c.phone as customer_phone,
        c.email as customer_email,
        r.device_type,
        r.device_model,
        r.serial_number,
        r.issue_description,
        r.technician,
        r.status,
        r.date_received,
        r.deadline,
        r.date_completed,
        r.estimated_cost,
        r.advance_payment,
        r.extra_expenses,
        r.device_password,
        r.additional_notes,
        r.is_under_warranty
      FROM
        repairs r
      LEFT JOIN
        customers c ON r.customer_id = c.id
    `;

    let params = [];

    // Add search functionality if search parameter is provided
    if (search) {
      query += `
        WHERE
          r.repair_id LIKE ? OR
          c.name LIKE ? OR
          c.phone LIKE ? OR
          r.device_model LIKE ? OR
          r.status LIKE ?
      `;
      params = [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`];
    }

    query += ' ORDER BY r.date_received DESC';

    try {
      const [rows] = await db.query(query, params);

      // Format the results
      const repairs = await Promise.all(rows.map(async (row) => {
        // Get products for this repair
        const products = await this.getRepairProducts(row.repair_id);

        return {
          id: row.repair_id.toString(),
          customer: row.customer_name,
          customerId: row.customer_id,
          phone: row.customer_phone,
          email: row.customer_email || 'Not Available',
          deviceType: row.device_type,
          deviceModel: row.device_model,
          serialNumber: row.serial_number || '',
          issue: row.issue_description,
          technician: row.technician,
          status: row.status,
          dateReceived: row.date_received,
          deadline: row.deadline,
          dateCompleted: row.date_completed,
          estimatedCost: parseFloat(row.estimated_cost).toLocaleString(),
          advancePayment: parseFloat(row.advance_payment).toLocaleString(),
          extraExpenses: parseFloat(row.extra_expenses || 0).toLocaleString(),
          products: products.map(p => p.name),
          password: row.device_password || '',
          additionalNotes: row.additional_notes || '',
          isUnderWarranty: row.is_under_warranty === 1
        };
      }));

      return repairs;
    } catch (error) {
      throw new Error(`Error fetching repairs: ${error.message}`);
    }
  }

  // Get a repair by ID
  static async findById(id) {
    try {
      const [rows] = await db.query(
        `SELECT
          r.repair_id,
          r.customer_id,
          c.name as customer_name,
          c.phone as customer_phone,
          c.email as customer_email,
          r.device_type,
          r.device_model,
          r.serial_number,
          r.issue_description,
          r.technician,
          r.status,
          r.date_received,
          r.deadline,
          r.date_completed,
          r.estimated_cost,
          r.advance_payment,
          r.extra_expenses,
          r.device_password,
          r.additional_notes,
          r.is_under_warranty
        FROM
          repairs r
        LEFT JOIN
          customers c ON r.customer_id = c.id
        WHERE
          r.repair_id = ?`,
        [id]
      );

      if (rows.length === 0) {
        return null;
      }

      const row = rows[0];

      // Get products for this repair
      const products = await this.getRepairProducts(row.repair_id);

      return {
        id: row.repair_id.toString(),
        customer: row.customer_name,
        customerId: row.customer_id,
        phone: row.customer_phone,
        email: row.customer_email || 'Not Available',
        deviceType: row.device_type,
        deviceModel: row.device_model,
        serialNumber: row.serial_number || '',
        issue: row.issue_description,
        technician: row.technician,
        status: row.status,
        dateReceived: row.date_received,
        deadline: row.deadline,
        dateCompleted: row.date_completed,
        estimatedCost: parseFloat(row.estimated_cost).toLocaleString(),
        advancePayment: parseFloat(row.advance_payment).toLocaleString(),
        extraExpenses: parseFloat(row.extra_expenses || 0).toLocaleString(),
        products: products.map(p => p.name),
        password: row.device_password || '',
        additionalNotes: row.additional_notes || '',
        isUnderWarranty: row.is_under_warranty === 1
      };
    } catch (error) {
      throw new Error(`Error fetching repair: ${error.message}`);
    }
  }

  // Get products for a repair
  static async getRepairProducts(repairId) {
    try {
      const [rows] = await db.query(
        `SELECT
          rp.id,
          rp.name,
          rp.specifications,
          rp.condition_notes
        FROM
          repair_products rp
        WHERE
          rp.repair_id = ?`,
        [repairId]
      );

      return rows;
    } catch (error) {
      throw new Error(`Error fetching repair products: ${error.message}`);
    }
  }

  // Create a new repair
  static async create(repairData) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Extract products from repair data
      const { products, ...repairDetails } = repairData;

      // Format currency values
      const estimatedCost = parseFloat(repairDetails.estimatedCost.replace(/,/g, ''));
      const advancePayment = parseFloat(repairDetails.advancePayment.replace(/,/g, ''));
      const extraExpenses = parseFloat(repairDetails.extraExpenses ? repairDetails.extraExpenses.replace(/,/g, '') : '0');

      // Prepare repair data for insertion
      const repairToInsert = {
        customer_id: repairDetails.customerId,
        device_type: repairDetails.deviceType,
        device_model: repairDetails.deviceModel,
        serial_number: repairDetails.serialNumber,
        issue_description: repairDetails.issue,
        technician: repairDetails.technician,
        status: repairDetails.status,
        date_received: new Date().toISOString().split('T')[0],
        deadline: repairDetails.deadline,
        estimated_cost: estimatedCost,
        advance_payment: advancePayment,
        extra_expenses: extraExpenses,
        device_password: repairDetails.password || '',
        additional_notes: repairDetails.additionalNotes || '',
        is_under_warranty: repairDetails.isUnderWarranty ? 1 : 0
      };

      // Insert repair
      const [result] = await connection.query('INSERT INTO repairs SET ?', repairToInsert);
      const repairId = result.insertId;

      // Insert products if any
      if (products && products.length > 0) {
        for (const product of products) {
          await connection.query(
            'INSERT INTO repair_products (repair_id, name, specifications, condition_notes) VALUES (?, ?, ?, ?)',
            [repairId, product, '', '']
          );
        }
      }

      await connection.commit();
      return repairId;
    } catch (error) {
      await connection.rollback();
      throw new Error(`Error creating repair: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  // Update a repair
  static async update(id, repairData) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Extract products from repair data
      const { products, ...repairDetails } = repairData;

      // Format currency values
      const estimatedCost = parseFloat(repairDetails.estimatedCost.replace(/,/g, ''));
      const advancePayment = parseFloat(repairDetails.advancePayment.replace(/,/g, ''));
      const extraExpenses = parseFloat(repairDetails.extraExpenses ? repairDetails.extraExpenses.replace(/,/g, '') : '0');

      // Prepare repair data for update
      const repairToUpdate = {
        customer_id: repairDetails.customerId,
        device_type: repairDetails.deviceType,
        device_model: repairDetails.deviceModel,
        serial_number: repairDetails.serialNumber,
        issue_description: repairDetails.issue,
        technician: repairDetails.technician,
        status: repairDetails.status,
        deadline: repairDetails.deadline,
        estimated_cost: estimatedCost,
        advance_payment: advancePayment,
        extra_expenses: extraExpenses,
        device_password: repairDetails.password || '',
        additional_notes: repairDetails.additionalNotes || '',
        is_under_warranty: repairDetails.isUnderWarranty ? 1 : 0
      };

      // Update repair
      await connection.query('UPDATE repairs SET ? WHERE repair_id = ?', [repairToUpdate, id]);

      // Delete existing products
      await connection.query('DELETE FROM repair_products WHERE repair_id = ?', [id]);

      // Insert updated products if any
      if (products && products.length > 0) {
        for (const product of products) {
          await connection.query(
            'INSERT INTO repair_products (repair_id, name, specifications, condition_notes) VALUES (?, ?, ?, ?)',
            [id, product, '', '']
          );
        }
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw new Error(`Error updating repair: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  // Update repair status
  static async updateStatus(id, status) {
    try {
      // If status is "Picked Up", set the date_completed field to current date
      if (status === 'Picked Up') {
        const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
        await db.query(
          'UPDATE repairs SET status = ?, date_completed = ? WHERE repair_id = ?',
          [status, currentDate, id]
        );
      } else {
        // For other statuses, just update the status field
        await db.query('UPDATE repairs SET status = ? WHERE repair_id = ?', [status, id]);
      }
      return true;
    } catch (error) {
      throw new Error(`Error updating repair status: ${error.message}`);
    }
  }

  // Delete a repair
  static async delete(id) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Delete products first (due to foreign key constraint)
      await connection.query('DELETE FROM repair_products WHERE repair_id = ?', [id]);

      // Delete repair
      await connection.query('DELETE FROM repairs WHERE repair_id = ?', [id]);

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw new Error(`Error deleting repair: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  // Check warranty eligibility by serial number
  static async checkWarrantyBySerialNumber(serialNumber) {
    try {
      const [rows] = await db.query(`
        SELECT
          p.name AS product_name,
          c.name AS category,
          pu.warranty,
          cu.name AS customer_name,
          cu.phone,
          cu.email,
          cu.id AS customer_id,
          p.product_id,
          s.sale_id,
          pu.purchase_id,
          s.date AS purchase_date
        FROM
          sale_serials ss
        JOIN
          sales s ON ss.sale_id = s.sale_id
        JOIN
          product p ON s.product_id = p.product_id
        JOIN
          category c ON p.category_id = c.category_id
        JOIN
          purchases pu ON s.purchase_id = pu.purchase_id
        JOIN
          customers cu ON s.customer_id = cu.id
        WHERE
          ss.serial_number = ?
      `, [serialNumber]);

      if (rows.length === 0) {
        return null;
      }

      // Calculate warranty remaining days
      const purchaseDate = new Date(rows[0].purchase_date);
      const warrantyMonths = parseInt(rows[0].warranty) || 0;
      const warrantyDays = warrantyMonths * 30; // Approximate 30 days per month

      // Calculate warranty end date
      const warrantyEndDate = new Date(purchaseDate);
      warrantyEndDate.setDate(warrantyEndDate.getDate() + warrantyDays);

      // Calculate remaining days
      const today = new Date();
      const remainingDays = Math.max(0, Math.floor((warrantyEndDate - today) / (1000 * 60 * 60 * 24)));

      // Add warranty information to the result
      return {
        ...rows[0],
        warranty_end_date: warrantyEndDate.toISOString().split('T')[0],
        warranty_remaining_days: remainingDays,
        is_under_warranty: remainingDays > 0
      };
    } catch (error) {
      throw new Error(`Error checking warranty: ${error.message}`);
    }
  }

  // Search for serial numbers
  static async searchSerialNumbers(query) {
    try {
      if (!query || query.trim() === '') {
        return [];
      }

      const [rows] = await db.query(`
        SELECT
          ss.serial_number,
          p.name AS product_name,
          pu.warranty,
          s.date AS purchase_date
        FROM
          sale_serials ss
        JOIN
          sales s ON ss.sale_id = s.sale_id
        JOIN
          product p ON s.product_id = p.product_id
        JOIN
          purchases pu ON s.purchase_id = pu.purchase_id
        WHERE
          ss.serial_number LIKE ?
        LIMIT 10
      `, [`%${query}%`]);

      return rows.map(row => {
        // Calculate warranty remaining days
        const purchaseDate = new Date(row.purchase_date);
        const warrantyMonths = parseInt(row.warranty) || 0;
        const warrantyDays = warrantyMonths * 30; // Approximate 30 days per month

        // Calculate warranty end date
        const warrantyEndDate = new Date(purchaseDate);
        warrantyEndDate.setDate(warrantyEndDate.getDate() + warrantyDays);

        // Calculate remaining days
        const today = new Date();
        const remainingDays = Math.max(0, Math.floor((warrantyEndDate - today) / (1000 * 60 * 60 * 24)));

        return {
          serial_number: row.serial_number,
          product_name: row.product_name,
          warranty: row.warranty,
          warranty_remaining_days: remainingDays,
          is_under_warranty: remainingDays > 0
        };
      });
    } catch (error) {
      throw new Error(`Error searching serial numbers: ${error.message}`);
    }
  }

  // Get repairs assigned to a specific technician with optional search
  static async findByTechnician(technicianId, search = '') {
    let query = `
      SELECT
        r.repair_id,
        r.customer_id,
        c.name as customer_name,
        c.phone as customer_phone,
        c.email as customer_email,
        r.device_type,
        r.device_model,
        r.serial_number,
        r.issue_description,
        r.technician,
        r.status,
        r.date_received,
        r.deadline,
        r.date_completed,
        r.estimated_cost,
        r.advance_payment,
        r.extra_expenses,
        r.device_password,
        r.additional_notes,
        r.is_under_warranty
      FROM
        repairs r
      LEFT JOIN
        customers c ON r.customer_id = c.id
      WHERE
        r.technician = ?
    `;

    let params = [technicianId];

    // Add search functionality if search parameter is provided
    if (search) {
      query += `
        AND (
          r.repair_id LIKE ? OR
          c.name LIKE ? OR
          c.phone LIKE ? OR
          r.device_model LIKE ? OR
          r.status LIKE ?
        )
      `;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY r.date_received DESC';

    try {
      const [rows] = await db.query(query, params);

      // Format the results
      const repairs = await Promise.all(rows.map(async (row) => {
        // Get products for this repair
        const products = await this.getRepairProducts(row.repair_id);

        return {
          id: row.repair_id.toString(),
          customer: row.customer_name,
          customerId: row.customer_id,
          phone: row.customer_phone,
          email: row.customer_email || 'Not Available',
          deviceType: row.device_type,
          deviceModel: row.device_model,
          serialNumber: row.serial_number || '',
          issue: row.issue_description,
          technician: row.technician,
          status: row.status,
          dateReceived: row.date_received,
          deadline: row.deadline,
          dateCompleted: row.date_completed,
          estimatedCost: parseFloat(row.estimated_cost).toLocaleString(),
          advancePayment: parseFloat(row.advance_payment).toLocaleString(),
          extraExpenses: parseFloat(row.extra_expenses || 0).toLocaleString(),
          products: products.map(p => p.name),
          password: row.device_password || '',
          additionalNotes: row.additional_notes || '',
          isUnderWarranty: row.is_under_warranty === 1
        };
      }));

      return repairs;
    } catch (error) {
      throw new Error(`Error fetching technician repairs: ${error.message}`);
    }
  }
}

module.exports = Repair;
