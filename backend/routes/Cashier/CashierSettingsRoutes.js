const express = require('express');
const cashierSettingsController = require('../../Controllers/Cashier/CashierSettingsController');
const { authenticateUser } = require('../../utils/authenticateUser');
const { authorizeRole } = require('../../utils/authorizeRoles');

const router = express.Router();

// Protect all routes with authentication
router.use(authenticateUser);

// Protect all routes with Cashier authorization
router.use(authorizeRole(['Cashier']));

// Routes
router.get('/sale-undo-time-limit', cashierSettingsController.getSaleUndoTimeLimit);

module.exports = router;
