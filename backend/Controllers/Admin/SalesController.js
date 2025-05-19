const Sale = require('../../Models/Admin/SaleModel');
const Customer = require('../../Models/Admin/CustomerModel');
const Purchase = require('../../Models/Admin/PurchaseModel');
const Product = require('../../Models/Admin/ProductModel');

// Get all sales with optional filtering
exports.getAllSales = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      customerId,
      productId,
      page = 1,
      limit = 50,
      search
    } = req.query;

    const options = {
      startDate: startDate || null,
      endDate: endDate || null,
      customerId: customerId || null,
      productId: productId || null,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      search: search || ''
    };

    const { sales, totalCount, totalPages } = await Sale.findAll(options);

    res.status(200).json({
      status: 'success',
      results: sales.length,
      pagination: {
        totalCount,
        totalPages,
        currentPage: options.page,
        limit: options.limit
      },
      data: {
        sales
      }
    });
  } catch (error) {
    console.error("Error in getAllSales:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Get sale by ID
exports.getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);

    if (!sale) {
      return res.status(404).json({
        status: 'fail',
        message: 'No sale found with that ID'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        sale
      }
    });
  } catch (error) {
    console.error("Error in getSaleById:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Create a new sale
exports.createSale = async (req, res) => {
  try {
    const { customer, items, payment_method, amount_paid, change_amount } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ status: 'fail', message: 'Sale must include at least one item' });
    }
    if (!customer || !customer.phone) {
      return res.status(400).json({ status: 'fail', message: 'Customer phone number is required' });
    }

    // Find or create customer
    let customerId;
    const existingCustomer = await Customer.findByPhone(customer.phone);
    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const newCustomer = await Customer.create({
        name: customer.name || 'Walk-in Customer',
        phone: customer.phone,
        email: customer.email || null
      });
      customerId = newCustomer.id;
    }

    // Validate each item
    for (const item of items) {
      const product = await Product.findById(item.product_id);
      if (!product) {
        return res.status(400).json({ status: 'fail', message: `Product with ID ${item.product_id} not found` });
      }
      const purchase = await Purchase.findById(item.purchase_id);
      if (!purchase) {
        return res.status(400).json({ status: 'fail', message: `Purchase with ID ${item.purchase_id} not found` });
      }
      if (purchase.remaining_quantity < item.quantity) {
        return res.status(400).json({ status: 'fail', message: `Not enough stock for product ${product.name} (${purchase.remaining_quantity} available)` });
      }
      if (product.requires_serial && (!item.serial_numbers || item.serial_numbers.length !== item.quantity)) {
        return res.status(400).json({ status: 'fail', message: `Serial numbers are required for product ${product.name} and must match quantity` });
      }
    }

    // Create sale (serials handled in model)
    const saleData = {
      customer_id: customerId,
      items: items.map(item => ({
        product_id: item.product_id,
        purchase_id: item.purchase_id,
        quantity: item.quantity,
        serial_numbers: item.serial_numbers || [],
        discount: item.discount || 0
      })),
      payment_method: payment_method || 'Cash',
      amount_paid: amount_paid || 0,
      change_amount: change_amount || 0,
      created_by: req.user.id
    };

    const sale = await Sale.create(saleData);

    res.status(201).json({
      status: 'success',
      data: { sale }
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message || 'Internal server error' });
  }
};

// In your Sale model or controller


// Update a sale
exports.updateSale = async (req, res) => {
  try {
    // Only allow updating payment details or status
    const allowedFields = ['payment_method', 'payment_status', 'notes'];

    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        status: 'fail',
        message: 'No valid fields to update'
      });
    }

    const sale = await Sale.update(req.params.id, updateData);

    if (!sale) {
      return res.status(404).json({
        status: 'fail',
        message: 'No sale found with that ID'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        sale
      }
    });
  } catch (error) {
    console.error("Error in updateSale:", error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        status: 'fail',
        message: error.message
      });
    }

    if (error.message.includes('required') ||
        error.message.includes('invalid')) {
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

// Delete a sale
exports.deleteSale = async (req, res) => {
  try {
    // Check if the sale exists first
    const existingSale = await Sale.findById(req.params.id);

    if (!existingSale) {
      return res.status(404).json({
        status: 'fail',
        message: 'No sale found with that ID'
      });
    }

    // Check if the sale can be deleted (e.g., not associated with warranty claims)
    const canDelete = await Sale.canDelete(req.params.id);

    if (!canDelete.success) {
      return res.status(400).json({
        status: 'fail',
        message: canDelete.message
      });
    }

    // Delete the sale
    await Sale.delete(req.params.id);

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    console.error("Error in deleteSale:", error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        status: 'fail',
        message: error.message
      });
    }

    if (error.message.includes('cannot delete')) {
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

// Generate invoice PDF
exports.generateInvoice = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);

    if (!sale) {
      return res.status(404).json({
        status: 'fail',
        message: 'No sale found with that ID'
      });
    }

    // This would handle PDF generation logic
    // For implementation, you would use a library like PDFKit or html-pdf
    // The actual PDF generation is outside the scope of this code

    res.status(200).json({
      status: 'success',
      message: 'Invoice generation feature will be implemented soon',
      data: {
        sale
      }
    });
  } catch (error) {
    console.error("Error in generateInvoice:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Get sales statistics
exports.getSalesStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Validate dates if provided
    if ((startDate && isNaN(new Date(startDate).getTime())) ||
        (endDate && isNaN(new Date(endDate).getTime()))) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid date format'
      });
    }

    const stats = await Sale.getStats(startDate, endDate);

    res.status(200).json({
      status: 'success',
      data: {
        stats
      }
    });
  } catch (error) {
    console.error("Error in getSalesStats:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Get top selling products
exports.getTopProducts = async (req, res) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;

    // Validate dates if provided
    if ((startDate && isNaN(new Date(startDate).getTime())) ||
        (endDate && isNaN(new Date(endDate).getTime()))) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid date format'
      });
    }

    const products = await Sale.getTopProducts(startDate, endDate, parseInt(limit, 10));

    res.status(200).json({
      status: 'success',
      results: products.length,
      data: {
        products
      }
    });
  } catch (error) {
    console.error("Error in getTopProducts:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};