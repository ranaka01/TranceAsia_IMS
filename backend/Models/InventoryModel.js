const db = require('../db');

class Inventory {
  // Get all products with their total remaining quantity
  static async getAllProducts() {
    try {
      const query = `
        SELECT 
          p.product_id AS id,
          p.name,
          c.name AS category,
          p.details,
          COALESCE(SUM(pur.remaining_quantity), 0) AS remaining_quantity
        FROM 
          product p
        LEFT JOIN 
          category c ON p.category_id = c.category_id
        LEFT JOIN 
          purchases pur ON p.product_id = pur.product_id
        WHERE 
          p.is_active = 1
        GROUP BY 
          p.product_id, p.name, c.name, p.details
        ORDER BY 
          p.name ASC
      `;
      
      const [rows] = await db.query(query);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching products: ${error.message}`);
    }
  }
  
  // Get all purchases for a specific product
  static async getProductPurchases(productId) {
    try {
      const query = `
        SELECT 
          purchase_id,
          quantity,
          remaining_quantity,
          warranty,
          buying_price,
          selling_price,
          date
        FROM 
          purchases
        WHERE 
          product_id = ?
        ORDER BY 
          date DESC
      `;
      
      const [rows] = await db.query(query, [productId]);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching product purchases: ${error.message}`);
    }
  }
}

module.exports = Inventory;