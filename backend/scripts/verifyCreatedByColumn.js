const mysql = require('mysql2/promise');
require('dotenv').config();

async function testCreatedByColumn() {
  // Create a separate connection for this test
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tranceasia_ims'
  });

  try {
    console.log('Testing created_by column in invoice table...');
    
    // Check if the column exists
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'invoice' 
      AND COLUMN_NAME = 'created_by'
    `);
    
    if (columns.length === 0) {
      console.error('❌ created_by column does not exist in invoice table');
      return false;
    }
    
    console.log('✅ created_by column exists in invoice table');
    console.log('Column details:', columns[0]);
    
    // Check if the foreign key constraint exists
    const [constraints] = await connection.query(`
      SELECT CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'invoice'
      AND COLUMN_NAME = 'created_by'
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    
    if (constraints.length === 0) {
      console.log('⚠️ No foreign key constraint found for created_by column');
    } else {
      console.log('✅ Foreign key constraint exists for created_by column');
      console.log('Constraint details:', constraints[0]);
    }
    
    // Check if the column is being used in queries
    const [recentSales] = await connection.query(`
      SELECT 
        i.invoice_no, 
        i.created_by, 
        u.Username 
      FROM invoice i
      LEFT JOIN user u ON i.created_by = u.User_ID
      ORDER BY i.invoice_no DESC
      LIMIT 5
    `);
    
    console.log('Recent sales with created_by information:');
    console.table(recentSales);
    
    return true;
  } catch (error) {
    console.error('Error testing created_by column:', error);
    return false;
  } finally {
    await connection.end();
    process.exit();
  }
}

// Run the test
testCreatedByColumn();
