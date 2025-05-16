const express = require('express');
const salesController = require('../Controllers/SalesController');
const { authenticateUser } = require('../utils/authenticateUser');
const { authorizeRole } = require('../utils/authorizeRoles');

const router = express.Router();

// Protect all routes with authentication
router.use(authenticateUser);

// Routes accessible by all authenticated users
router.get('/', salesController.getAllSales);
router.get('/:id', salesController.getSaleById);

// Routes accessible by admin and cashier roles
router.post('/', authorizeRole(['Admin', 'Cashier']), salesController.createSale);
router.patch('/:id', authorizeRole(['Admin']), salesController.updateSale);
router.delete('/:id', authorizeRole(['Admin']), salesController.deleteSale);

module.exports = router;