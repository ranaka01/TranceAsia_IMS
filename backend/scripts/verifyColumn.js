const db = require('../db');

async function verifyColumn() {
  try {
    console.log('Verifying extra_expenses column...');
    
    // Check if the column exists
    const [columns] = await db.query(`
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'repairs' 
      AND COLUMN_NAME = 'extra_expenses'
    `);
    
    if (columns.length === 0) {
      console.log('❌ Column does not exist in the repairs table!');
      return false;
    } else {
      const column = columns[0];
      console.log('✅ Column exists in the repairs table!');
      console.log('Column details:');
      console.log(`- Name: ${column.COLUMN_NAME}`);
      console.log(`- Data Type: ${column.DATA_TYPE}`);
      console.log(`- Column Type: ${column.COLUMN_TYPE}`);
      console.log(`- Is Nullable: ${column.IS_NULLABLE}`);
      console.log(`- Default Value: ${column.COLUMN_DEFAULT}`);
      return true;
    }
  } catch (error) {
    console.error('Error verifying column:', error);
    return false;
  }
}

// Run the verification
verifyColumn()
  .then(exists => {
    if (exists) {
      console.log('Verification completed successfully');
      process.exit(0);
    } else {
      console.error('Verification failed - column does not exist');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Verification failed with error:', error);
    process.exit(1);
  });
