const db = require('../db');
const fs = require('fs');
const path = require('path');

async function createPurchaseUndoLogsTable() {
  try {
    console.log('Creating purchase_undo_logs table...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '../database/migrations/create_purchase_undo_logs_table.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split the SQL file into individual statements
    const statements = sql.split(';').filter(statement => statement.trim() !== '');
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        await db.query(statement);
        console.log('Executed SQL statement successfully');
      }
    }
    
    console.log('Purchase undo logs table created successfully');
    return true;
  } catch (error) {
    console.error('Error creating purchase undo logs table:', error);
    return false;
  }
}

// Run the migration
createPurchaseUndoLogsTable()
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
