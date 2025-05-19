const express = require('express');
const salesController = require('../../Controllers/Admin/SalesController');
const { authenticateUser } = require('../../utils/authenticateUser');
const { authorizeRole } = require('../../utils/authorizeRoles');

const router = express.Router();

router.use(authenticateUser);

router.get('/', salesController.getAllSales);
router.get('/:id', salesController.getSaleById);
router.post('/', authorizeRole(['Admin', 'Cashier']), salesController.createSale);
router.patch('/:id', authorizeRole(['Admin']), salesController.updateSale);
router.delete('/:id', authorizeRole(['Admin']), salesController.deleteSale);

module.exports = router;
