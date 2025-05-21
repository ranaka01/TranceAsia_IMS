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
router.get('/sales-stats', authorizeRole(['Admin']), dashboardController.getSalesStats);

// Purchase report routes
router.get('/purchase-stats', authorizeRole(['Admin']), dashboardController.getPurchaseStats);
router.get('/top-suppliers', authorizeRole(['Admin']), dashboardController.getTopSuppliers);
router.get('/purchase-category-breakdown', authorizeRole(['Admin']), dashboardController.getPurchaseCategoryBreakdown);

// Repair report routes
router.get('/repair-stats', authorizeRole(['Admin']), dashboardController.getRepairStats);
router.get('/technician-performance', authorizeRole(['Admin']), dashboardController.getTechnicianPerformance);
router.get('/device-type-analysis', authorizeRole(['Admin']), dashboardController.getDeviceTypeAnalysis);
router.get('/revenue-by-date', authorizeRole(['Admin']), dashboardController.getRevenueByDate);

module.exports = router;
