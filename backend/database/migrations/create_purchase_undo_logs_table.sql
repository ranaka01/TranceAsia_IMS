-- Create purchase_undo_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS `purchase_undo_logs` (
  `log_id` INT AUTO_INCREMENT PRIMARY KEY,
  `purchase_id` INT NOT NULL,
  `product_id` INT NOT NULL,
  `quantity` INT NOT NULL,
  `buying_price` DECIMAL(10,2) NOT NULL,
  `supplier_id` INT NOT NULL,
  `date_purchased` DATETIME NOT NULL,
  `date_undone` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `undone_by` VARCHAR(50) NOT NULL,
  `reason` VARCHAR(255),
  FOREIGN KEY (`product_id`) REFERENCES `product`(`product_id`) ON DELETE CASCADE,
  FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`supplier_id`) ON DELETE CASCADE
);
