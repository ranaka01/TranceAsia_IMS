const Purchase = require('../Models/PurchaseModel');

// Get all purchases
exports.getAllPurchases = async (req, res) => {
  try {
    const search = req.query.search || '';
    const purchases = await Purchase.findAll(search);
    
    res.status(200).json({
      status: 'success',
      results: purchases.length,
      data: {
        purchases
      }
    });
  } catch (error) {
    console.error("Error in getAllPurchases:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Get a specific purchase
exports.getPurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    
    if (!purchase) {
      return res.status(404).json({
        status: 'fail',
        message: 'No purchase found with that ID'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        purchase
      }
    });
  } catch (error) {
    console.error("Error in getPurchase:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// MODIFIED: Create a new purchase with better validation and logging
exports.createPurchase = async (req, res) => {
  console.log("Received purchase data:", req.body);
  
  try {
    // Validate that product_id is present and is a number
    if (!req.body.product_id) {
      return res.status(400).json({
        status: 'fail',
        message: 'Product ID is required'
      });
    }
    
    if (isNaN(parseInt(req.body.product_id))) {
      return res.status(400).json({
        status: 'fail',
        message: 'Product ID must be a number'
      });
    }
    
    // Create a clean purchase data object with proper type conversion
    const purchaseData = {
      product_id: parseInt(req.body.product_id),
      quantity: parseInt(req.body.quantity) || 0,
      remaining_quantity: parseInt(req.body.quantity) || 0, // Initialize remaining quantity
      warranty: req.body.warranty || '12 months',
      buying_price: parseFloat(req.body.buying_price) || 0,
      selling_price: parseFloat(req.body.selling_price) || 0,
      date: req.body.date || new Date().toISOString().split('T')[0]
    };
    
    console.log("Processed purchase data:", purchaseData);
    
    const newPurchase = await Purchase.create(purchaseData);
    
    console.log("Created purchase:", newPurchase);
    
    res.status(201).json({
      status: 'success',
      data: {
        purchase: newPurchase
      }
    });
  } catch (error) {
    console.error("Error in createPurchase:", error);
    
    // Check if it's a validation error
    if (
      error.message.includes('required') ||
      error.message.includes('must be') ||
      error.message.includes('not found')
    ) {
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

//remaining quantity



// Update a purchase
exports.updatePurchase = async (req, res) => {
  try {
    const updatedPurchase = await Purchase.update(req.params.id, req.body);
    
    res.status(200).json({
      status: 'success',
      data: {
        purchase: updatedPurchase
      }
    });
  } catch (error) {
    console.error("Error in updatePurchase:", error);
    
    // Check if purchase not found
    if (error.message.includes('not found')) {
      return res.status(404).json({
        status: 'fail',
        message: error.message
      });
    }
    
    // Check if it's a validation error or has associated sales
    if (
      error.message.includes('required') ||
      error.message.includes('must be') ||
      error.message.includes('associated sales')
    ) {
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

// Delete a purchase
exports.deletePurchase = async (req, res) => {
  try {
    await Purchase.delete(req.params.id);
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    console.error("Error in deletePurchase:", error);
    
    // Check if purchase not found
    if (error.message.includes('not found')) {
      return res.status(404).json({
        status: 'fail',
        message: error.message
      });
    }
    
    // Check if purchase has associated sales
    if (error.message.includes('associated sales')) {
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