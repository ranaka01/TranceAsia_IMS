const db = require('../db');
const fs = require('fs');
const path = require('path');

async function runMigration(migrationFile) {
  try {
    console.log(`Running migration: ${migrationFile}...`);
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '../database/migrations', migrationFile);
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
    
    console.log(`Migration ${migrationFile} completed successfully`);
    return true;
  } catch (error) {
    console.error(`Error running migration ${migrationFile}:`, error);
    return false;
  }
}

// Get the migration file from command line arguments
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('Please provide a migration file name');
  process.exit(1);
}

// Run the migration
runMigration(migrationFile)
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
