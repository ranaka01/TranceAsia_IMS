const express = require('express');
const purchaseController = require('../../Controllers/Admin/PurchaseController');
const { authenticateUser } = require('../../utils/authenticateUser');
const { authorizeRole } = require('../../utils/authorizeRoles');

const router = express.Router();

// Protect all routes with authentication
router.use(authenticateUser);

// Routes accessible by all authenticated users
router.get('/', purchaseController.getAllPurchases);
router.get('/product/:productId/available', purchaseController.getAvailablePurchasesByProduct);

// Routes accessible only by admin users
router.post('/', authorizeRole(['Admin']), purchaseController.createPurchase);
router.post('/undo-last', authorizeRole(['Admin']), purchaseController.undoLastPurchase);
router.get('/undo-logs', authorizeRole(['Admin']), purchaseController.getPurchaseUndoLogs);
router.get('/undo-logs/export-csv', authorizeRole(['Admin']), purchaseController.exportPurchaseUndoLogsCSV);

// This route must be last because it uses a parameter that could match any other route
router.get('/:id', purchaseController.getPurchase);
router.patch('/:id', authorizeRole(['Admin']), purchaseController.updatePurchase);
router.delete('/:id', authorizeRole(['Admin']), purchaseController.deletePurchase);

module.exports = router;