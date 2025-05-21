const Purchase = require('../../Models/Admin/PurchaseModel');

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


exports.getAvailablePurchasesByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const purchases = await Purchase.findAvailableStockByProduct(productId);
    res.json({ status: 'success', data: { purchases } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
};

// Undo the last purchase
exports.undoLastPurchase = async (req, res) => {
  try {
    const { reason } = req.body;
    const userId = req.user.id;
    const username = req.user.username || 'Unknown User';

    console.log('Undoing last purchase for user:', username, 'with reason:', reason);

    // Find the most recent purchase for this user
    const lastPurchase = await Purchase.findLastPurchase(userId);

    if (!lastPurchase) {
      return res.status(404).json({
        status: 'fail',
        message: 'No recent purchases found to undo'
      });
    }

    console.log('Found last purchase:', lastPurchase);

    // Check if the purchase can be undone (e.g., no sales associated with it)
    const canUndo = await Purchase.canUndo(lastPurchase.purchase_id);

    if (!canUndo.success) {
      return res.status(400).json({
        status: 'fail',
        message: canUndo.message
      });
    }

    // Undo the purchase (log it and delete it)
    await Purchase.undoLastPurchase(lastPurchase.purchase_id, username, reason);

    res.status(200).json({
      status: 'success',
      message: 'Last purchase has been successfully undone',
      data: {
        purchase: lastPurchase
      }
    });
  } catch (error) {
    console.error("Error in undoLastPurchase:", error);

    if (error.message.includes('not found') || error.message.includes('No recent purchases')) {
      return res.status(404).json({
        status: 'fail',
        message: error.message
      });
    }

    if (error.message.includes('cannot undo') || error.message.includes('associated sales')) {
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

// Get purchase undo logs
exports.getPurchaseUndoLogs = async (req, res) => {
  try {
    console.log('getPurchaseUndoLogs called with query:', req.query);
    const { page = 1, limit = 10, search = '', startDate, endDate } = req.query;

    // Prepare options for the model
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      search
    };

    // Add date filters if provided
    if (startDate) {
      options.startDate = new Date(startDate);
    }

    if (endDate) {
      options.endDate = new Date(endDate);
    }

    console.log('Fetching purchase undo logs with options:', options);

    // Get logs from the model
    const result = await Purchase.getPurchaseUndoLogs(options);

    console.log(`Found ${result.logs.length} purchase undo logs`);

    res.status(200).json({
      status: 'success',
      data: {
        logs: result.logs,
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalCount: result.totalCount,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error("Error in getPurchaseUndoLogs:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Export purchase undo logs as CSV
exports.exportPurchaseUndoLogsCSV = async (req, res) => {
  try {
    console.log('exportPurchaseUndoLogsCSV called with query:', req.query);
    const { search = '', startDate, endDate } = req.query;

    // Prepare options for the model - no pagination for export
    const options = {
      page: 1,
      limit: 1000, // High limit to get all records
      search,
      forExport: true
    };

    // Add date filters if provided
    if (startDate) {
      options.startDate = new Date(startDate);
    }

    if (endDate) {
      options.endDate = new Date(endDate);
    }

    // Get logs from the model
    const result = await Purchase.getPurchaseUndoLogs(options);
    const logs = result.logs;

    console.log(`Exporting ${logs.length} purchase undo logs to CSV`);

    // Check if we have the json2csv package
    let json2csv;
    try {
      json2csv = require('json2csv');
    } catch (err) {
      console.error('json2csv package not found:', err);
      return res.status(500).json({
        status: 'error',
        message: 'CSV export functionality is not available. Please install the json2csv package.'
      });
    }

    // Define fields for CSV
    const fields = [
      { label: 'Purchase ID', value: 'purchase_id' },
      { label: 'Product', value: 'product_name' },
      { label: 'Supplier', value: 'supplier_name' },
      { label: 'Quantity', value: 'quantity' },
      { label: 'Buying Price', value: 'buying_price' },
      { label: 'Date Purchased', value: row => new Date(row.date_purchased).toISOString().split('T')[0] },
      { label: 'Date Undone', value: row => new Date(row.date_undone).toISOString().split('T')[0] },
      { label: 'Undone By', value: 'undone_by' },
      { label: 'Reason', value: 'reason' }
    ];

    // Generate CSV
    const { Parser } = json2csv;
    const parser = new Parser({ fields });
    const csv = parser.parse(logs);

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=purchase_undo_logs.csv');

    // Send CSV data
    res.status(200).send(csv);
  } catch (error) {
    console.error("Error in exportPurchaseUndoLogsCSV:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};