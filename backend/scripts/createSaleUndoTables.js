const db = require('../db');
const fs = require('fs');
const path = require('path');

async function createSaleUndoTables() {
  try {
    console.log('Creating sale_undo_logs and system_settings tables...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '../database/migrations/create_sale_undo_logs_table.sql');
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
    
    console.log('Sale undo logs and system settings tables created successfully');
    return true;
  } catch (error) {
    console.error('Error creating tables:', error);
    return false;
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  createSaleUndoTables()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch(err => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = createSaleUndoTables;
