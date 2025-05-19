const express = require('express');
const supplierController = require('../../Controllers/Admin/SupplierController');
const { authenticateUser } = require('../../utils/authenticateUser');
const { authorizeRole } = require('../../utils/authorizeRoles');

const router = express.Router();

// Protect all routes with authentication
router.use(authenticateUser);

// Routes accessible by all authenticated users
router.get('/', supplierController.getAllSuppliers);
router.get('/:id', supplierController.getSupplier);

// Routes accessible only by admin users
router.post('/', authorizeRole(['Admin']), supplierController.createSupplier);
router.patch('/:id', authorizeRole(['Admin']), supplierController.updateSupplier);
router.delete('/:id', authorizeRole(['Admin']), supplierController.deleteSupplier);

module.exports = router;