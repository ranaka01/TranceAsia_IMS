-- Check if the column exists
SET @columnExists = 0;
SELECT COUNT(*) INTO @columnExists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'repairs' 
AND COLUMN_NAME = 'extra_expenses';

-- Add the column if it doesn't exist
SET @query = IF(@columnExists = 0, 
    'ALTER TABLE `repairs` ADD COLUMN `extra_expenses` decimal(10,2) NOT NULL DEFAULT 0.00 AFTER `advance_payment`', 
    'SELECT "Column already exists"');

PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update any existing NULL values to 0.00
UPDATE `repairs` SET `extra_expenses` = 0.00 WHERE `extra_expenses` IS NULL;
