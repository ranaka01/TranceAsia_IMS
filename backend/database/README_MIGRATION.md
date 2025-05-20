# Database Migration Guide

This guide explains how to run the migration scripts to update the database schema.

## Adding serial_number column to supplier_returns table

The `serial_number` column needs to be added to the `supplier_returns` table to support the new functionality for tracking serial numbers in supplier returns.

### Option 1: Run the migration script

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Run the migration script:
   ```
   node database/migrations/add_serial_number_to_supplier_returns.js
   ```

3. You should see a success message if the migration was successful.

### Option 2: Execute the SQL directly

If the migration script doesn't work, you can execute the SQL directly in your database management tool:

```sql
ALTER TABLE `supplier_returns` 
ADD COLUMN `serial_number` VARCHAR(100) DEFAULT NULL AFTER `notes`;
```

### Verifying the migration

To verify that the column was added successfully, you can run the following SQL query:

```sql
DESCRIBE supplier_returns;
```

You should see the `serial_number` column in the results.

## After running the migration

After successfully adding the column, you need to uncomment the validation code in the `SupplierReturnModel.js` file:

1. Open `backend/Models/Admin/SupplierReturnModel.js`
2. Find the commented validation code (around line 168)
3. Uncomment the validation code:
   ```javascript
   // Validate serial number is provided for Repaired status
   if (return_status === 'Repaired' && !serial_number) {
     throw new Error('Serial number is required for repaired items');
   }
   ```
4. Update the INSERT query to include the serial_number column (around line 200)

## Troubleshooting

If you encounter any issues:

1. Check that you have the correct database credentials in your `.env` file
2. Verify that the `supplier_returns` table exists in your database
3. Check for any error messages in the console
4. Make sure you have the necessary permissions to alter tables in the database
