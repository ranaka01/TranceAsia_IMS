const express = require('express');
const repairController = require('../Controllers/RepairController');
const { authenticateUser } = require('../utils/authenticateUser');
const { authorizeRole } = require('../utils/authorizeRoles');

const router = express.Router();

// Protect all routes with authentication
router.use(authenticateUser);

// Routes accessible by all authenticated users
router.get('/', repairController.getAllRepairs);
// Specific routes must come before parameterized routes
router.get('/search/serial-numbers', repairController.searchSerialNumbers);
router.get('/products/with-stock', repairController.getProductsWithStock);
router.get('/warranty/:serialNumber', repairController.checkWarrantyBySerialNumber);
// Generic parameterized route should be last
router.get('/:id', repairController.getRepairById);

// Routes accessible by Admin and Technician
router.post('/', authorizeRole(['Admin', 'Technician']), repairController.createRepair);
router.patch('/:id', authorizeRole(['Admin', 'Technician']), repairController.updateRepair);
router.patch('/:id/status', authorizeRole(['Admin', 'Technician']), repairController.updateRepairStatus);
router.delete('/:id', authorizeRole(['Admin']), repairController.deleteRepair);

module.exports = router;
