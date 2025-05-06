const Product = require('../Models/ProductModel');

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const search = req.query.search || '';
    const categoryId = req.query.categoryId || '';
    
    const products = await Product.findAll(search, categoryId);
    
    res.status(200).json({
      status: 'success',
      results: products.length,
      data: {
        products
      }
    });
  } catch (error) {
    console.error("Error in getAllProducts:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Get a specific product
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        status: 'fail',
        message: 'No product found with that ID'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        product
      }
    });
  } catch (error) {
    console.error("Error in getProduct:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Get all product categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Product.getCategories();
    
    res.status(200).json({
      status: 'success',
      data: {
        categories
      }
    });
  } catch (error) {
    console.error("Detailed error in getCategories:", error.stack);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Create a new product
exports.createProduct = async (req, res) => {
  try {
    console.log("Creating product with data:", req.body);
    
    const newProduct = await Product.create(req.body);
    
    res.status(201).json({
      status: 'success',
      data: {
        product: newProduct
      }
    });
  } catch (error) {
    console.error("Error in createProduct:", error);
    
    if (error.message.includes('required') || error.message.includes('not found')) {
      return res.status(400).json({
        status: 'fail',
        message: error.message
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Update a product
exports.updateProduct = async (req, res) => {
  try {
    console.log("Updating product with ID:", req.params.id);
    console.log("Update data:", req.body);
    
    const updatedProduct = await Product.update(req.params.id, req.body);
    
    res.status(200).json({
      status: 'success',
      data: {
        product: updatedProduct
      }
    });
  } catch (error) {
    console.error("Error in updateProduct:", error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        status: 'fail',
        message: error.message
      });
    }
    
    if (error.message.includes('required') || error.message.includes('Invalid')) {
      return res.status(400).json({
        status: 'fail',
        message: error.message
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Delete a product
exports.deleteProduct = async (req, res) => {
  try {
    console.log("Deleting product with ID:", req.params.id);
    
    await Product.delete(req.params.id);
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    console.error("Error in deleteProduct:", error);
    
    if (error.message.includes('not found')) {
      return res.status(404).json({
        status: 'fail',
        message: error.message
      });
    }
    
    if (error.message.includes('associated')) {
      return res.status(400).json({
        status: 'fail',
        message: error.message
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Add a new category
exports.addCategory = async (req, res) => {
  try {
    const { category } = req.body;
    
    if (!category) {
      return res.status(400).json({
        status: 'fail',
        message: 'Category name is required'
      });
    }
    
    console.log("Adding new category:", category);
    
    const result = await Product.addCategory(category);
    
    res.status(201).json({
      status: 'success',
      data: {
        category: result
      }
    });
  } catch (error) {
    console.error("Error in addCategory:", error);
    
    if (error.message.includes('already exists')) {
      return res.status(400).json({
        status: 'fail',
        message: error.message
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Update a category - FIXED
exports.updateCategory = async (req, res) => {
  try {
    const { oldCategory, newCategory } = req.body;
    
    if (!oldCategory || !newCategory) {
      return res.status(400).json({
        status: 'fail',
        message: 'Both old and new category names are required'
      });
    }
    
    console.log("Updating category from", oldCategory, "to", newCategory);
    
    // Call the updateCategory method specifically
    const result = await Product.updateCategory(oldCategory, newCategory);
    
    res.status(200).json({
      status: 'success',
      data: {
        category: result
      }
    });
  } catch (error) {
    console.error("Error in updateCategory:", error);
    
    if (error.message.includes('already exists') || error.message.includes('not found')) {
      return res.status(400).json({
        status: 'fail',
        message: error.message
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Delete a category
exports.deleteCategory = async (req, res) => {
  try {
    const { category } = req.params;
    
    if (!category) {
      return res.status(400).json({
        status: 'fail',
        message: 'Category name is required'
      });
    }
    
    console.log("Deleting category:", category);
    
    const result = await Product.deleteCategory(category);
    
    res.status(200).json({
      status: 'success',
      data: {
        category: result
      }
    });
  } catch (error) {
    console.error("Error in deleteCategory:", error);
    
    if (error.message.includes('in use') || error.message.includes('not found')) {
      return res.status(400).json({
        status: 'fail',
        message: error.message
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};