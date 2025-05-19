const db = require('../../db');

class ProductSupplier {
    constructor(product_id, supplier_id) {
        this.product_id = product_id;
        this.supplier_id = supplier_id;
    }

    async save() {
        const query = 'INSERT INTO Product_Supplier (product_id, supplier_id) VALUES (?, ?)';
        const values = [this.product_id, this.supplier_id];

        try {
            const [result] = await db.query(query, values);
            return result.insertId;
        } catch (error) {
            throw new Error(`Error saving product-supplier relation: ${error.message}`);
        }
    }

    static async getSuppliersByProduct(productId) {
        const query = `
        SELECT s.* FROM suppliers s
        JOIN product p ON p.supplier_id = s.supplier_id
        WHERE p.product_id = ?
         `;

        console.log("Fetching suppliers for product ID:", productId);

        try {
            const [rows] = await db.query(query, [productId]);
            return rows;
        } catch (error) {
            throw new Error(`Error fetching suppliers for product: ${error.message}`);
        }
    }
}

module.exports = ProductSupplier;
