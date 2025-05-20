const db = require('../db');
const fs = require('fs');
const path = require('path');

async function addCreatedByColumn() {
  const connection = await db.getConnection();
  try {
    console.log('Starting migration to add created_by column to invoice table...');
    
    // Check if the column exists
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'invoice' 
      AND COLUMN_NAME = 'created_by'
    `);
    
    if (columns.length === 0) {
      console.log('Column does not exist. Adding created_by column...');
      
      // Read the SQL file
      const sqlFilePath = path.join(__dirname, '../database/migrations/add_created_by_column.sql');
      const sql = fs.readFileSync(sqlFilePath, 'utf8');
      
      // Split the SQL file into individual statements
      const statements = sql.split(';').filter(statement => statement.trim() !== '');
      
      // Execute each statement
      for (const statement of statements) {
        if (statement.trim()) {
          await connection.query(statement);
          console.log('Executed SQL statement successfully');
        }
      }
      
      console.log('Column added successfully!');
    } else {
      console.log('Column already exists. No changes needed.');
    }
    
    console.log('Migration completed successfully!');
    return true;
  } catch (error) {
    console.error('Error during migration:', error);
    return false;
  } finally {
    connection.release();
  }
}

// Run the migration
addCreatedByColumn()
  .then(success => {
    if (success) {
      console.log('Migration completed successfully');
      process.exit(0);
    } else {
      console.error('Migration failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
