const db = require('../db');

async function fixPurchaseUndoLogsTable() {
  const connection = await db.getConnection();
  try {
    console.log('Starting to fix purchase_undo_logs table...');
    
    // Check if the table exists
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'purchase_undo_logs'
    `);
    
    if (tables.length === 0) {
      console.log('Table does not exist. Creating purchase_undo_logs table...');
      
      // Create the table if it doesn't exist
      await connection.query(`
        CREATE TABLE IF NOT EXISTS purchase_undo_logs (
          log_id INT AUTO_INCREMENT PRIMARY KEY,
          purchase_id INT NOT NULL,
          product_id INT NOT NULL,
          quantity INT NOT NULL,
          buying_price DECIMAL(10,2) NOT NULL,
          supplier_id INT NOT NULL,
          date_purchased DATETIME NOT NULL,
          date_undone DATETIME DEFAULT CURRENT_TIMESTAMP,
          undone_by VARCHAR(50) NOT NULL,
          reason VARCHAR(255),
          FOREIGN KEY (product_id) REFERENCES product(product_id) ON DELETE CASCADE,
          FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id) ON DELETE CASCADE
        )
      `);
      
      console.log('purchase_undo_logs table created successfully');
    } else {
      console.log('Table exists. Checking for purchase_id foreign key constraint...');
      
      // Check if the table has the purchase_id foreign key constraint
      const [constraints] = await connection.query(`
        SELECT CONSTRAINT_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'purchase_undo_logs'
        AND COLUMN_NAME = 'purchase_id'
        AND REFERENCED_TABLE_NAME = 'purchases'
      `);
      
      // If the constraint exists, drop it
      if (constraints.length > 0) {
        console.log('Found purchase_id foreign key constraint. Dropping it...');
        
        // Get the constraint name
        const constraintName = constraints[0].CONSTRAINT_NAME;
        
        // Drop the constraint
        await connection.query(`
          ALTER TABLE purchase_undo_logs
          DROP FOREIGN KEY ${constraintName}
        `);
        
        console.log('Foreign key constraint dropped successfully');
      } else {
        console.log('No purchase_id foreign key constraint found. No changes needed.');
      }
    }
    
    console.log('purchase_undo_logs table fix completed successfully!');
    return true;
  } catch (error) {
    console.error('Error fixing purchase_undo_logs table:', error);
    return false;
  } finally {
    connection.release();
  }
}

// Run the fix
fixPurchaseUndoLogsTable()
  .then(success => {
    if (success) {
      console.log('Fix completed successfully');
      process.exit(0);
    } else {
      console.error('Fix failed');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Fix failed:', error);
    process.exit(1);
  });
