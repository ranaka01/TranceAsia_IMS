const express = require('express');
const customerController = require('../Controllers/CustomerController');
const { authenticateUser } = require('../utils/authenticateUser');
const { authorizeRole } = require('../utils/authorizeRoles');

const router = express.Router();

// Protect all routes with authentication
router.use(authenticateUser);

// Routes accessible by all authenticated users
router.get('/', customerController.getAllCustomers);
router.get('/:id', customerController.getCustomer);
router.get('/phone/:phone', customerController.findCustomerByPhone);

// Routes accessible by Admin and Cashier users
router.post('/', authorizeRole(['Admin', 'Cashier']), customerController.createCustomer);
router.patch('/:id', authorizeRole(['Admin', 'Cashier']), customerController.updateCustomer);
router.delete('/:id', authorizeRole(['Admin']), customerController.deleteCustomer);

module.exports = router;