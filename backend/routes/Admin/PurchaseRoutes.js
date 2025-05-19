const express = require('express');
const purchaseController = require('../../Controllers/Admin/PurchaseController');
const { authenticateUser } = require('../../utils/authenticateUser');
const { authorizeRole } = require('../../utils/authorizeRoles');

const router = express.Router();

// Protect all routes with authentication
router.use(authenticateUser);

// Routes accessible by all authenticated users
router.get('/', purchaseController.getAllPurchases);
router.get('/:id', purchaseController.getPurchase);
router.get('/product/:productId/available', purchaseController.getAvailablePurchasesByProduct);

// Routes accessible only by admin users
router.post('/', authorizeRole(['Admin']), purchaseController.createPurchase);
router.patch('/:id', authorizeRole(['Admin']), purchaseController.updatePurchase);
router.delete('/:id', authorizeRole(['Admin']), purchaseController.deletePurchase);

module.exports = router;