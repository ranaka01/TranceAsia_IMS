const SupplierReturn = require('../../Models/Admin/SupplierReturnModel');

// Get all supplier returns
exports.getAllSupplierReturns = async (req, res) => {
  try {
    const search = req.query.search || '';
    const returns = await SupplierReturn.findAll(search);

    res.status(200).json({
      status: 'success',
      results: returns.length,
      data: {
        returns
      }
    });
  } catch (error) {
    console.error("Error in getAllSupplierReturns:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Get a specific supplier return
exports.getSupplierReturn = async (req, res) => {
  try {
    const returnItem = await SupplierReturn.findById(req.params.id);

    if (!returnItem) {
      return res.status(404).json({
        status: 'fail',
        message: 'No supplier return found with that ID'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        return: returnItem
      }
    });
  } catch (error) {
    console.error("Error in getSupplierReturn:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Get product details by purchase ID
exports.getProductDetailsByPurchaseId = async (req, res) => {
  try {
    const purchaseId = req.params.purchaseId;
    
    if (!purchaseId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Purchase ID is required'
      });
    }
    
    const productDetails = await SupplierReturn.getProductDetailsByPurchaseId(purchaseId);
    
    if (!productDetails) {
      return res.status(404).json({
        status: 'fail',
        message: 'No product found with that purchase ID'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        productDetails
      }
    });
  } catch (error) {
    console.error("Error in getProductDetailsByPurchaseId:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Create a new supplier return
exports.createSupplierReturn = async (req, res) => {
  try {
    const newReturn = await SupplierReturn.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        return: newReturn
      }
    });
  } catch (error) {
    console.error("Error in createSupplierReturn:", error);
    
    // Check if it's a validation error
    if (
      error.message.includes('required') ||
      error.message.includes('Not enough') ||
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

// Update a supplier return
exports.updateSupplierReturn = async (req, res) => {
  try {
    const updatedReturn = await SupplierReturn.update(req.params.id, req.body);

    res.status(200).json({
      status: 'success',
      data: {
        return: updatedReturn
      }
    });
  } catch (error) {
    console.error("Error in updateSupplierReturn:", error);
    
    // Check if return not found
    if (error.message.includes('not found')) {
      return res.status(404).json({
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
