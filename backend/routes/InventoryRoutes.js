const express = require('express');
const inventoryController = require('../Controllers/InventoryController');
const { authenticateUser } = require('../utils/authenticateUser');

const router = express.Router();

// Protect all routes with authentication
router.use(authenticateUser);

// Routes for inventory operations
router.get('/products', inventoryController.getAllProducts);
router.get('/products/:id/purchases', inventoryController.getProductPurchases);

module.exports = router;