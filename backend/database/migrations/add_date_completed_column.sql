-- Add date_completed column to repairs table if it doesn't exist
ALTER TABLE `repairs` 
ADD COLUMN IF NOT EXISTS `date_completed` DATE DEFAULT NULL 
AFTER `deadline`;

-- This column will store the date when a repair's status is changed to "Picked Up"
-- The format will be YYYY-MM-DD
-- Default value is NULL (not completed yet)
