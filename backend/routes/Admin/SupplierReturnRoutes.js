const express = require('express');
const supplierReturnController = require('../../Controllers/Admin/SupplierReturnController');
const { authenticateUser } = require('../../utils/authenticateUser');
const { authorizeRole } = require('../../utils/authorizeRoles');

const router = express.Router();

// Protect all routes with authentication
router.use(authenticateUser);

// Routes accessible by all authenticated users
router.get('/', supplierReturnController.getAllSupplierReturns);
router.get('/:id', supplierReturnController.getSupplierReturn);
router.get('/purchase/:purchaseId', supplierReturnController.getProductDetailsByPurchaseId);

// Routes accessible only by admin users
router.post('/', authorizeRole(['Admin']), supplierReturnController.createSupplierReturn);
router.patch('/:id', authorizeRole(['Admin']), supplierReturnController.updateSupplierReturn);

module.exports = router;
