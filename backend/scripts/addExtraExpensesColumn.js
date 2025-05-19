const db = require('../db');

async function addExtraExpensesColumn() {
  const connection = await db.getConnection();
  try {
    console.log('Starting migration to add extra_expenses column...');
    
    // Check if the column exists
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'repairs' 
      AND COLUMN_NAME = 'extra_expenses'
    `);
    
    if (columns.length === 0) {
      console.log('Column does not exist. Adding extra_expenses column...');
      
      // Add the column
      await connection.query(`
        ALTER TABLE repairs 
        ADD COLUMN extra_expenses decimal(10,2) NOT NULL DEFAULT 0.00 
        AFTER advance_payment
      `);
      
      console.log('Column added successfully!');
    } else {
      console.log('Column already exists. No changes needed.');
    }
    
    // Update any NULL values to 0.00
    await connection.query(`
      UPDATE repairs 
      SET extra_expenses = 0.00 
      WHERE extra_expenses IS NULL
    `);
    
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
addExtraExpensesColumn()
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
