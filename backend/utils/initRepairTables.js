const db = require('../db');
const fs = require('fs');
const path = require('path');

async function initRepairTables() {
  try {
    console.log('Initializing repair tables...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '../database/repair_tables.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split the SQL file into individual statements
    const statements = sql.split(';').filter(statement => statement.trim() !== '');
    
    // Execute each statement
    for (const statement of statements) {
      await db.query(statement);
      console.log('Executed SQL statement successfully');
    }
    
    console.log('Repair tables initialized successfully');
  } catch (error) {
    console.error('Error initializing repair tables:', error);
  }
}

// Execute the function if this file is run directly
if (require.main === module) {
  initRepairTables()
    .then(() => {
      console.log('Initialization complete');
      process.exit(0);
    })
    .catch(error => {
      console.error('Initialization failed:', error);
      process.exit(1);
    });
}

module.exports = initRepairTables;
