const db = require('../db');
const fs = require('fs');
const path = require('path');

async function addDateCompletedColumn() {
  const connection = await db.getConnection();
  try {
    console.log('Starting migration to add date_completed column...');
    
    // Check if the column exists
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'repairs' 
      AND COLUMN_NAME = 'date_completed'
    `);
    
    if (columns.length === 0) {
      console.log('Column does not exist. Adding date_completed column...');
      
      // Add the column
      await connection.query(`
        ALTER TABLE repairs 
        ADD COLUMN date_completed DATE DEFAULT NULL 
        AFTER deadline
      `);
      
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
addDateCompletedColumn()
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
