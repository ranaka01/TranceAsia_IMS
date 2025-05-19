const Inventory = require('../../Models/Admin/InventoryModel');

// Get all products with their remaining quantity
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Inventory.getAllProducts();

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

// Get all purchases for a specific product
exports.getProductPurchases = async (req, res) => {
  try {
    const productId = req.params.id;

    // Validate productId is a number
    if (isNaN(parseInt(productId))) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid product ID'
      });
    }

    const purchases = await Inventory.getProductPurchases(productId);

    res.status(200).json({
      status: 'success',
      results: purchases.length,
      data: {
        purchases
      }
    });
  } catch (error) {
    console.error("Error in getProductPurchases:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};