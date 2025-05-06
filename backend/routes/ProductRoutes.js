const express = require('express');
const productController = require('../Controllers/ProductController');
const { authenticateUser } = require('../utils/authenticateUser');
const { authorizeRole } = require('../utils/authorizeRoles');

const router = express.Router();

// Protect all routes with authentication
router.use(authenticateUser);

// Product routes
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProduct);
router.post('/', authorizeRole(['Admin']), productController.createProduct);
router.patch('/:id', authorizeRole(['Admin']), productController.updateProduct);
router.delete('/:id', authorizeRole(['Admin']), productController.deleteProduct);

// Category routes - Separated from product routes
router.get('/categories/all', productController.getCategories);
router.post('/categories/add', authorizeRole(['Admin']), productController.addCategory);
router.patch('/categories/update', authorizeRole(['Admin']), productController.updateCategory);
router.delete('/categories/delete/:category', authorizeRole(['Admin']), productController.deleteCategory);

module.exports = router;