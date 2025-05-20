-- Add serial_number column to supplier_returns table
ALTER TABLE `supplier_returns` 
ADD COLUMN `serial_number` VARCHAR(100) DEFAULT NULL AFTER `notes`;
