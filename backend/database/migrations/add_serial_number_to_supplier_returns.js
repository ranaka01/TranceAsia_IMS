const db = require('../../db');
const fs = require('fs');
const path = require('path');

async function addSerialNumberToSupplierReturns() {
  try {
    console.log('Adding serial_number column to supplier_returns table...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '..', 'add_serial_number_to_supplier_returns.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL
    await db.query(sql);
    
    console.log('serial_number column added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error adding serial_number column:', error);
    process.exit(1);
  }
}

// Run the migration
addSerialNumberToSupplierReturns();
