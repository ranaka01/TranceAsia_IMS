const express = require('express');
const saleUndoLogController = require('../../Controllers/Admin/SaleUndoLogController');
const { authenticateUser } = require('../../utils/authenticateUser');
const { authorizeRole } = require('../../utils/authorizeRoles');

const router = express.Router();

// Protect all routes with authentication
router.use(authenticateUser);

// Protect all routes with Admin authorization
router.use(authorizeRole(['Admin']));

// Routes
router.get('/', saleUndoLogController.getAllUndoLogs);
router.get('/export-csv', saleUndoLogController.exportUndoLogsCSV);
router.get('/:id', saleUndoLogController.getUndoLogById);

module.exports = router;
