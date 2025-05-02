const express = require('express');
const productController = require('../Controllers/ProductController');
const { authenticateUser } = require('../utils/authenticateUser');
const { authorizeRole } = require('../utils/authorizeRoles');

const router = express.Router();

// Protect all routes with authentication
router.use(authenticateUser);

// Routes accessible by all authenticated users
router.get('/', productController.getAllProducts);
router.get('/categories', productController.getCategories);
router.get('/:id', productController.getProduct);

// Routes accessible only by admin users
router.post('/', authorizeRole(['Admin']), productController.createProduct);
router.patch('/:id', authorizeRole(['Admin']), productController.updateProduct);
router.delete('/:id', authorizeRole(['Admin']), productController.deleteProduct);

// Category management routes (admin only)
router.post('/categories', authorizeRole(['Admin']), productController.addCategory);
router.patch('/categories', authorizeRole(['Admin']), productController.updateCategory);
router.delete('/categories/:category', authorizeRole(['Admin']), productController.deleteCategory);

module.exports = router;