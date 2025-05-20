-- Add serial_number column to supplier_returns table if it doesn't exist
ALTER TABLE `supplier_returns` 
ADD COLUMN IF NOT EXISTS `serial_number` VARCHAR(100) DEFAULT NULL AFTER `notes`;

-- If your MySQL version doesn't support ADD COLUMN IF NOT EXISTS, use this instead:
-- First check if the column exists
-- SELECT COUNT(*) INTO @exists FROM information_schema.columns 
-- WHERE table_schema = DATABASE() AND table_name = 'supplier_returns' AND column_name = 'serial_number';

-- Then add it only if it doesn't exist
-- SET @query = IF(@exists = 0, 'ALTER TABLE `supplier_returns` ADD COLUMN `serial_number` VARCHAR(100) DEFAULT NULL AFTER `notes`', 'SELECT "Column already exists"');
-- PREPARE stmt FROM @query;
-- EXECUTE stmt;
-- DEALLOCATE PREPARE stmt;
