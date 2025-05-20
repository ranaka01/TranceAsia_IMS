const db = require('../../db');
const fs = require('fs');
const path = require('path');

async function createSupplierReturnsTable() {
  try {
    console.log('Creating supplier_returns table...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '..', 'supplier_returns_table.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL
    await db.query(sql);
    
    console.log('supplier_returns table created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating supplier_returns table:', error);
    process.exit(1);
  }
}

// Run the migration
createSupplierReturnsTable();
