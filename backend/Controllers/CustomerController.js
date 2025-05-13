const Customer = require('../Models/CustomerModel');

// Get all customers
exports.getAllCustomers = async (req, res) => {
  try {
    const search = req.query.search || '';
    const customers = await Customer.findAll(search);
    
    res.status(200).json({
      status: 'success',
      results: customers.length,
      data: {
        customers
      }
    });
  } catch (error) {
    console.error("Error in getAllCustomers:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Get a specific customer
exports.getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({
        status: 'fail',
        message: 'No customer found with that ID'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        customer
      }
    });
  } catch (error) {
    console.error("Error in getCustomer:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Find customer by phone number
exports.findCustomerByPhone = async (req, res) => {
  try {
    const phone = req.params.phone;
    const customer = await Customer.findByPhone(phone);
    
    if (!customer) {
      return res.status(404).json({
        status: 'fail',
        message: 'No customer found with that phone number'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        customer
      }
    });
  } catch (error) {
    console.error("Error in findCustomerByPhone:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Create a new customer
exports.createCustomer = async (req, res) => {
  console.log("Received request to create customer with data:", req.body);

  try {
    const newCustomer = await Customer.create(req.body);
    console.log("Customer created successfully:", newCustomer);

    res.status(201).json({
      status: 'success',
      data: {
        customer: newCustomer
      }
    });
  } catch (error) {
    console.error("Error in createCustomer:", error);

    // Check if it's a validation error
    if (
      error.message.includes('required') ||
      error.message.includes('format') ||
      error.message.includes('Invalid') ||
      error.message.includes('already exists')
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

// Update a customer
exports.updateCustomer = async (req, res) => {
  try {
    const updatedCustomer = await Customer.update(req.params.id, req.body);
    
    res.status(200).json({
      status: 'success',
      data: {
        customer: updatedCustomer
      }
    });
  } catch (error) {
    console.error("Error in updateCustomer:", error);
    
    // Check if customer not found
    if (error.message.includes('not found')) {
      return res.status(404).json({
        status: 'fail',
        message: error.message
      });
    }
    
    // Check if it's a validation error
    if (error.message.includes('required') || 
        error.message.includes('format') || 
        error.message.includes('Invalid') ||
        error.message.includes('already exists')) {
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

// Delete a customer
exports.deleteCustomer = async (req, res) => {
  try {
    await Customer.delete(req.params.id);
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    console.error("Error in deleteCustomer:", error);
    
    // Check if customer not found
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