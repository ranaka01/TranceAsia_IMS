-- Table structure for table `repairs`
CREATE TABLE IF NOT EXISTS `repairs` (
  `repair_id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) DEFAULT NULL,
  `device_type` varchar(100) NOT NULL,
  `device_model` varchar(100) NOT NULL,
  `serial_number` varchar(100) DEFAULT NULL,
  `issue_description` text NOT NULL,
  `technician` varchar(100) NOT NULL,
  `status` enum('Pending','In Progress','Waiting for Parts','Completed','Cannot Repair','Picked Up') NOT NULL DEFAULT 'Pending',
  `date_received` date NOT NULL,
  `deadline` date NOT NULL,
  `estimated_cost` decimal(10,2) NOT NULL DEFAULT 0.00,
  `advance_payment` decimal(10,2) NOT NULL DEFAULT 0.00,
  `extra_expenses` decimal(10,2) NOT NULL DEFAULT 0.00,
  `device_password` varchar(100) DEFAULT NULL,
  `additional_notes` text DEFAULT NULL,
  `is_under_warranty` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`repair_id`),
  KEY `customer_id` (`customer_id`),
  CONSTRAINT `repairs_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for table `repair_products`
CREATE TABLE IF NOT EXISTS `repair_products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `repair_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `specifications` text DEFAULT NULL,
  `condition_notes` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `repair_id` (`repair_id`),
  CONSTRAINT `repair_products_ibfk_1` FOREIGN KEY (`repair_id`) REFERENCES `repairs` (`repair_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table structure for table `repair_history`
CREATE TABLE IF NOT EXISTS `repair_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `repair_id` int(11) NOT NULL,
  `status` enum('Pending','In Progress','Waiting for Parts','Completed','Cannot Repair','Picked Up') NOT NULL,
  `notes` text DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `repair_id` (`repair_id`),
  KEY `updated_by` (`updated_by`),
  CONSTRAINT `repair_history_ibfk_1` FOREIGN KEY (`repair_id`) REFERENCES `repairs` (`repair_id`) ON DELETE CASCADE,
  CONSTRAINT `repair_history_ibfk_2` FOREIGN KEY (`updated_by`) REFERENCES `user` (`User_ID`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

