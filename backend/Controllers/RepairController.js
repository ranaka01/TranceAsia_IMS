const Repair = require('../Models/RepairModel');
const Customer = require('../Models/Admin/CustomerModel');
const Notification = require('../Models/NotificationModel');
const db = require('../db');

// Choose the appropriate email service based on environment
const emailService = process.env.NODE_ENV === 'development'
  ? require('../utils/mockEmailService')  // Use mock service in development
  : require('../utils/emailService');     // Use real service in production

const { sendRepairStatusUpdateEmail } = emailService;

// Get all repairs
exports.getAllRepairs = async (req, res) => {
  try {
    const search = req.query.search || '';
    const repairs = await Repair.findAll(search);

    res.status(200).json({
      status: 'success',
      results: repairs.length,
      data: {
        repairs
      }
    });
  } catch (error) {
    console.error("Error in getAllRepairs:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Get a specific repair
exports.getRepairById = async (req, res) => {
  try {
    const repair = await Repair.findById(req.params.id);

    if (!repair) {
      return res.status(404).json({
        status: 'fail',
        message: 'No repair found with that ID'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        repair
      }
    });
  } catch (error) {
    console.error("Error in getRepairById:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Create a new repair
exports.createRepair = async (req, res) => {
  try {
    console.log("Received repair data:", req.body);

    // Check if customer exists, if not create a new one
    let customerId = req.body.customerId;

    if (!customerId && req.body.customer && req.body.phone) {
      // Try to find customer by phone
      const customers = await Customer.findByPhone(req.body.phone);

      if (customers && customers.length > 0) {
        customerId = customers[0].id;
      } else {
        // Create new customer
        const newCustomer = {
          name: req.body.customer,
          phone: req.body.phone,
          email: req.body.email || null,
          date: new Date().toISOString().split('T')[0]
        };

        customerId = await Customer.create(newCustomer);
      }
    }

    // Prepare repair data with customer ID
    const repairData = {
      ...req.body,
      customerId
    };

    const repairId = await Repair.create(repairData);

    res.status(201).json({
      status: 'success',
      data: {
        repairId
      }
    });
  } catch (error) {
    console.error("Error in createRepair:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Update a repair
exports.updateRepair = async (req, res) => {
  try {
    const repairId = req.params.id;

    // Check if repair exists
    const existingRepair = await Repair.findById(repairId);

    if (!existingRepair) {
      return res.status(404).json({
        status: 'fail',
        message: 'No repair found with that ID'
      });
    }

    // Check if customer exists, if not create a new one
    let customerId = req.body.customerId;

    if (!customerId && req.body.customer && req.body.phone) {
      // Try to find customer by phone
      const customers = await Customer.findByPhone(req.body.phone);

      if (customers && customers.length > 0) {
        customerId = customers[0].id;
      } else {
        // Create new customer
        const newCustomer = {
          name: req.body.customer,
          phone: req.body.phone,
          email: req.body.email || null,
          date: new Date().toISOString().split('T')[0]
        };

        customerId = await Customer.create(newCustomer);
      }
    }

    // Prepare repair data with customer ID
    const repairData = {
      ...req.body,
      customerId
    };

    await Repair.update(repairId, repairData);

    res.status(200).json({
      status: 'success',
      data: {
        message: 'Repair updated successfully'
      }
    });
  } catch (error) {
    console.error("Error in updateRepair:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Update repair status
exports.updateRepairStatus = async (req, res) => {
  try {
    const repairId = req.params.id;
    const { status, previousStatus } = req.body;

    if (!status) {
      return res.status(400).json({
        status: 'fail',
        message: 'Status is required'
      });
    }

    // Check if repair exists
    const existingRepair = await Repair.findById(repairId);

    if (!existingRepair) {
      return res.status(404).json({
        status: 'fail',
        message: 'No repair found with that ID'
      });
    }

    // Get the previous status if not provided
    const oldStatus = previousStatus || existingRepair.status;

    // Update the repair status
    await Repair.updateStatus(repairId, status);

    // Create a notification for the status change
    try {
      console.log('Creating notification with data:', {
        repairId: existingRepair.id,
        customer: existingRepair.customer,
        deviceType: existingRepair.deviceType,
        deviceModel: existingRepair.deviceModel,
        previousStatus: oldStatus,
        newStatus: status,
        technician: existingRepair.technician
      });

      const notificationId = await Notification.createRepairStatusNotification({
        repairId: existingRepair.id,
        customer: existingRepair.customer,
        deviceType: existingRepair.deviceType,
        deviceModel: existingRepair.deviceModel,
        previousStatus: oldStatus,
        newStatus: status,
        technician: existingRepair.technician
      });

      console.log(`Created notification #${notificationId} for repair #${repairId} status change from ${oldStatus} to ${status}`);
    } catch (notificationError) {
      console.error("Error creating notification:", notificationError);
      console.error("Error details:", notificationError.stack);
      // Continue with the response even if notification creation fails
    }

    // Prepare response object
    const responseData = {
      message: 'Repair status updated successfully',
      emailSent: false,
      notificationCreated: true
    };

    // Send email notification if customer email is available and not "Not Available"
    if (existingRepair.email && existingRepair.email !== 'Not Available') {
      try {
        // Prepare repair data for email
        const repairData = {
          repairId: existingRepair.id,
          customerName: existingRepair.customer,
          deviceName: existingRepair.deviceType,
          deviceModel: existingRepair.deviceModel,
          newStatus: status
        };

        // Send the email
        await sendRepairStatusUpdateEmail(existingRepair.email, repairData);

        // Update response to indicate email was sent
        responseData.emailSent = true;
        responseData.message = 'Repair status updated successfully and notification email sent';
      } catch (emailError) {
        console.error("Error sending status update email:", emailError);
        responseData.emailError = emailError.message;
        responseData.message = 'Repair status updated successfully but failed to send notification email';
      }
    } else {
      responseData.emailSkipped = true;
      responseData.message = 'Repair status updated successfully (email notification skipped - no valid email)';
    }

    res.status(200).json({
      status: 'success',
      data: responseData
    });
  } catch (error) {
    console.error("Error in updateRepairStatus:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Delete a repair
exports.deleteRepair = async (req, res) => {
  try {
    const repairId = req.params.id;

    // Check if repair exists
    const existingRepair = await Repair.findById(repairId);

    if (!existingRepair) {
      return res.status(404).json({
        status: 'fail',
        message: 'No repair found with that ID'
      });
    }

    await Repair.delete(repairId);

    res.status(200).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    console.error("Error in deleteRepair:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Check warranty by serial number
exports.checkWarrantyBySerialNumber = async (req, res) => {
  try {
    const { serialNumber } = req.params;

    if (!serialNumber) {
      return res.status(400).json({
        status: 'fail',
        message: 'Serial number is required'
      });
    }

    const warrantyInfo = await Repair.checkWarrantyBySerialNumber(serialNumber);

    if (!warrantyInfo) {
      return res.status(404).json({
        status: 'fail',
        message: 'No product found with that serial number'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        warrantyInfo
      }
    });
  } catch (error) {
    console.error("Error in checkWarrantyBySerialNumber:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Search for serial numbers
exports.searchSerialNumbers = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(200).json({
        status: 'success',
        data: {
          serialNumbers: []
        }
      });
    }

    const serialNumbers = await Repair.searchSerialNumbers(query);

    res.status(200).json({
      status: 'success',
      data: {
        serialNumbers
      }
    });
  } catch (error) {
    console.error("Error in searchSerialNumbers:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Get products with remaining stock for repairs
exports.getProductsWithStock = async (req, res) => {
  try {
    console.log('Fetching products with remaining stock for repairs');

    // Get search query if provided
    const search = req.query.search || '';
    let query = `
      SELECT
          p.product_id,
          p.name AS product_name,
          pu.purchase_id,
          pu.remaining_quantity,
          pu.selling_price,
          DATE_FORMAT(pu.date, '%Y-%m-%d') AS date
      FROM purchases pu
      JOIN product p ON pu.product_id = p.product_id
      WHERE pu.remaining_quantity > 0
    `;

    // Add search condition if search parameter is provided
    const params = [];
    if (search) {
      query += ` AND p.name LIKE ?`;
      params.push(`%${search}%`);
    }

    // Add order by clause
    query += ` ORDER BY p.name ASC, pu.date ASC`;

    // Execute the query
    const [products] = await db.query(query, params);

    console.log(`Found ${products.length} products with remaining stock`);

    res.status(200).json({
      status: 'success',
      results: products.length,
      data: {
        products
      }
    });
  } catch (error) {
    console.error("Error fetching products with stock:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};
