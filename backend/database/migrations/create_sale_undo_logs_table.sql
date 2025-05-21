-- Create sale_undo_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS `sale_undo_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `invoice_no` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `undo_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `reason_type` enum('Incorrect item', 'Wrong quantity', 'Customer changed mind', 'Pricing error', 'Other') NOT NULL,
  `reason_details` text DEFAULT NULL,
  `sale_data` JSON NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `invoice_no` (`invoice_no`),
  KEY `reason_type` (`reason_type`),
  CONSTRAINT `sale_undo_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`User_ID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create system_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text NOT NULL,
  `setting_description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Insert default system settings
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `setting_description`)
VALUES 
('sale_undo_time_limit', '10', 'Maximum time in minutes allowed to undo a sale (1-60)'),
('company_name', 'Trance Asia Computers', 'Company name used in reports and receipts'),
('company_address', '123 Main Street, Colombo, Sri Lanka', 'Company address used in reports and receipts'),
('company_phone', '+94 11 123 4567', 'Company phone number used in reports and receipts'),
('company_email', 'info@tranceasia.com', 'Company email used in reports and receipts')
ON DUPLICATE KEY UPDATE
  `setting_description` = VALUES(`setting_description`);
