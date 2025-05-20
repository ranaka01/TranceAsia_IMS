-- Add created_by column to invoice table if it doesn't exist
ALTER TABLE `invoice` 
ADD COLUMN IF NOT EXISTS `created_by` INT(11) DEFAULT NULL 
AFTER `payment_method`;

-- Add foreign key constraint to link created_by to User_ID in the user table
ALTER TABLE `invoice`
ADD CONSTRAINT `invoice_created_by_fk` 
FOREIGN KEY (`created_by`) REFERENCES `user` (`User_ID`) 
ON DELETE SET NULL;

-- Update any existing NULL values to a default value if needed
-- This is commented out as we want to keep existing records as NULL
-- UPDATE `invoice` SET `created_by` = 1 WHERE `created_by` IS NULL;
