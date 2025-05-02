const Supplier = require('../Models/SupplierModel');

// Get all suppliers
exports.getAllSuppliers = async (req, res) => {
  try {
    const search = req.query.search || '';
    const suppliers = await Supplier.findAll(search);
    
    res.status(200).json({
      status: 'success',
      results: suppliers.length,
      data: {
        suppliers
      }
    });
  } catch (error) {
    console.error("Error in getAllSuppliers:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Get a specific supplier
exports.getSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({
        status: 'fail',
        message: 'No supplier found with that ID'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        supplier
      }
    });
  } catch (error) {
    console.error("Error in getSupplier:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Create a new supplier
exports.createSupplier = async (req, res) => {
  console.log("Received request to create supplier with data:", req.body); // Debug Step 1

  try {
    const newSupplier = await Supplier.create(req.body);
    console.log("Supplier created successfully:", newSupplier); // Debug Step 2

    res.status(201).json({
      status: 'success',
      data: {
        supplier: newSupplier
      }
    });
  } catch (error) {
    console.error("Error in createSupplier:", error); // Debug Step 3

    // Check if it's a validation error
    if (
      error.message.includes('required') ||
      error.message.includes('format') ||
      error.message.includes('Invalid')
    ) {
      console.warn("Validation error while creating supplier:", error.message); // Debug Step 4
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


// Update a supplier
exports.updateSupplier = async (req, res) => {
  try {
    const updatedSupplier = await Supplier.update(req.params.id, req.body);
    
    res.status(200).json({
      status: 'success',
      data: {
        supplier: updatedSupplier
      }
    });
  } catch (error) {
    console.error("Error in updateSupplier:", error);
    
    // Check if supplier not found
    if (error.message.includes('not found')) {
      return res.status(404).json({
        status: 'fail',
        message: error.message
      });
    }
    
    // Check if it's a validation error
    if (error.message.includes('required') || 
        error.message.includes('format') || 
        error.message.includes('Invalid')) {
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

// Delete a supplier
exports.deleteSupplier = async (req, res) => {
  try {
    await Supplier.delete(req.params.id);
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    console.error("Error in deleteSupplier:", error);
    
    // Check if supplier not found
    if (error.message.includes('not found')) {
      return res.status(404).json({
        status: 'fail',
        message: error.message
      });
    }
    
    // Check if supplier has associated products
    if (error.message.includes('associated products')) {
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