-- Add extra_expenses column to repairs table
ALTER TABLE `repairs` 
ADD COLUMN `extra_expenses` decimal(10,2) NOT NULL DEFAULT 0.00 
AFTER `advance_payment`;

-- Update any existing NULL values to 0.00
UPDATE `repairs` SET `extra_expenses` = 0.00 WHERE `extra_expenses` IS NULL;
