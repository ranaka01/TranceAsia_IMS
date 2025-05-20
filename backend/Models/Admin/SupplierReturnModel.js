const db = require('../../db');

class SupplierReturn {
  // Get all supplier returns with optional search
  static async findAll(search = '') {
    let query = `
      SELECT
        sr.return_id,
        sr.purchase_id,
        sr.product_id,
        sr.supplier_id,
        sr.return_date,
        sr.return_reason,
        sr.quantity,
        sr.refund_amount,
        sr.notes,
        sr.created_at,
        p.name AS product_name,
        s.name AS supplier_name,
        s.shop_name,
        pur.buying_price,
        pur.date AS purchase_date
      FROM
        supplier_returns sr
      JOIN
        product p ON sr.product_id = p.product_id
      JOIN
        suppliers s ON sr.supplier_id = s.supplier_id
      LEFT JOIN
        purchases pur ON sr.purchase_id = pur.purchase_id
    `;

    let params = [];

    // Add search functionality if search parameter is provided
    if (search) {
      query += `
        WHERE
          p.name LIKE ? OR
          s.name LIKE ? OR
          s.shop_name LIKE ? OR
          sr.return_reason LIKE ?
      `;
      params = [
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`
      ];
    }

    query += ' ORDER BY sr.created_at DESC';

    try {
      const [rows] = await db.query(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching supplier returns: ${error.message}`);
    }
  }

  // Get a supplier return by ID
  static async findById(id) {
    try {
      const [rows] = await db.query(
        `SELECT
          sr.return_id,
          sr.purchase_id,
          sr.product_id,
          sr.supplier_id,
          sr.return_date,
          sr.return_reason,
          sr.quantity,
          sr.refund_amount,
          sr.notes,
          sr.created_at,
          p.name AS product_name,
          s.name AS supplier_name,
          s.shop_name,
          pur.buying_price,
          pur.date AS purchase_date
        FROM
          supplier_returns sr
        JOIN
          product p ON sr.product_id = p.product_id
        JOIN
          suppliers s ON sr.supplier_id = s.supplier_id
        LEFT JOIN
          purchases pur ON sr.purchase_id = pur.purchase_id
        WHERE
          sr.return_id = ?`,
        [id]
      );

      return rows[0];
    } catch (error) {
      throw new Error(`Error fetching supplier return: ${error.message}`);
    }
  }

  // Get product details by purchase ID
  static async getProductDetailsByPurchaseId(purchaseId) {
    try {
      const [rows] = await db.query(
        `SELECT
          p.purchase_id,
          p.quantity,
          p.warranty,
          p.buying_price,
          p.selling_price,
          p.date AS purchase_date,
          p.remaining_quantity,

          prod.product_id,
          prod.name AS product_name,
          prod.details AS product_details,

          s.supplier_id,
          s.name AS supplier_name,
          s.shop_name,
          s.phone AS supplier_phone,
          s.email AS supplier_email,
          s.address AS supplier_address

        FROM
          purchases p
        JOIN
          product prod ON p.product_id = prod.product_id
        JOIN
          suppliers s ON prod.supplier_id = s.supplier_id
        WHERE
          p.purchase_id = ?`,
        [purchaseId]
      );

      return rows[0];
    } catch (error) {
      throw new Error(`Error fetching product details: ${error.message}`);
    }
  }

  // Create a new supplier return
  static async create(returnData) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const {
        purchase_id,
        product_id,
        supplier_id,
        return_date,
        return_reason,
        quantity = 1,
        notes = null
      } = returnData;

      // Validate required fields
      if (!purchase_id) throw new Error('Purchase ID is required');
      if (!product_id) throw new Error('Product ID is required');
      if (!supplier_id) throw new Error('Supplier ID is required');
      if (!return_date) throw new Error('Return date is required');
      if (!return_reason) throw new Error('Return reason is required');

      // Get purchase details to check remaining quantity and get buying price
      const [purchaseRows] = await connection.query(
        'SELECT remaining_quantity, buying_price, quantity FROM purchases WHERE purchase_id = ?',
        [purchase_id]
      );

      if (purchaseRows.length === 0) {
        throw new Error('Purchase not found');
      }

      const purchase = purchaseRows[0];

      // Check if there's enough remaining quantity
      if (purchase.remaining_quantity < quantity) {
        throw new Error(`Not enough remaining quantity. Available: ${purchase.remaining_quantity}, Requested: ${quantity}`);
      }

      // Calculate refund amount as buying_price × quantity being returned
      const refund_amount = parseFloat(purchase.buying_price) * quantity;

      // Insert supplier return record
      const [result] = await connection.query(
        `INSERT INTO supplier_returns
          (purchase_id, product_id, supplier_id, return_date, return_reason,
           quantity, refund_amount, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          purchase_id,
          product_id,
          supplier_id,
          return_date,
          return_reason,
          quantity,
          refund_amount,
          notes
        ]
      );

      // Update the purchases table to reduce quantity and remaining_quantity
      await connection.query(
        `UPDATE purchases
         SET remaining_quantity = remaining_quantity - ?,
             quantity = quantity - ?
         WHERE purchase_id = ?`,
        [quantity, quantity, purchase_id]
      );

      await connection.commit();

      return {
        return_id: result.insertId,
        ...returnData,
        refund_amount
      };
    } catch (error) {
      await connection.rollback();
      throw new Error(`Error creating supplier return: ${error.message}`);
    } finally {
      connection.release();
    }
  }

  // Update a supplier return
  static async update(id, returnData) {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // Check if return exists
      const [returnRows] = await connection.query(
        'SELECT * FROM supplier_returns WHERE return_id = ?',
        [id]
      );

      if (returnRows.length === 0) {
        throw new Error('Supplier return not found');
      }

      const existingReturn = returnRows[0];

      // Update fields
      const updateFields = [];
      const updateValues = [];

      if (returnData.return_date !== undefined) {
        updateFields.push('return_date = ?');
        updateValues.push(returnData.return_date);
      }

      if (returnData.return_reason !== undefined) {
        updateFields.push('return_reason = ?');
        updateValues.push(returnData.return_reason);
      }

      // No return_status or repair_date fields anymore

      if (returnData.notes !== undefined) {
        updateFields.push('notes = ?');
        updateValues.push(returnData.notes);
      }

      // If no fields to update, return the existing return
      if (updateFields.length === 0) {
        return existingReturn;
      }

      // Add ID to values array for WHERE clause
      updateValues.push(id);

      const query = `
        UPDATE supplier_returns
        SET ${updateFields.join(', ')}
        WHERE return_id = ?
      `;

      await connection.query(query, updateValues);
      await connection.commit();

      // Fetch and return the updated return
      return this.findById(id);
    } catch (error) {
      await connection.rollback();
      throw new Error(`Error updating supplier return: ${error.message}`);
    } finally {
      connection.release();
    }
  }
}

module.exports = SupplierReturn;
