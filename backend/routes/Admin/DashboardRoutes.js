const express = require('express');
const dashboardController = require('../../Controllers/Admin/DashboardController');
const { authenticateUser } = require('../../utils/authenticateUser');
const { authorizeRole } = require('../../utils/authorizeRoles');

const router = express.Router();

// Protect all routes with authentication
router.use(authenticateUser);

// Routes accessible by Admin users
router.get('/summary', authorizeRole(['Admin']), dashboardController.getDashboardSummary);
router.get('/sales-chart', authorizeRole(['Admin']), dashboardController.getSalesChartData);
router.get('/repair-status', authorizeRole(['Admin']), dashboardController.getRepairStatusDistribution);
router.get('/top-products', authorizeRole(['Admin']), dashboardController.getTopSellingProducts);
router.get('/low-stock', authorizeRole(['Admin']), dashboardController.getLowStockItems);
router.get('/category-revenue', authorizeRole(['Admin']), dashboardController.getRevenueByCategory);

module.exports = router;
