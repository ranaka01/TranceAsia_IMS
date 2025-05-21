const db = require('../../db');
const { format, subDays, startOfMonth, endOfMonth } = require('date-fns');

// Get summary statistics for the dashboard
exports.getDashboardSummary = async (req, res) => {
  try {
    // Get total products count
    const [productsResult] = await db.query(`
      SELECT COUNT(*) as total FROM product WHERE is_active = 1
    `);

    // Get total customers count
    const [customersResult] = await db.query(`
      SELECT COUNT(*) as total FROM customers
    `);

    // Get total sales count
    const [salesResult] = await db.query(`
      SELECT COUNT(*) as total FROM invoice
    `);

    // Get total revenue
    const [revenueResult] = await db.query(`
      SELECT SUM(total) as total FROM invoice
    `);

    // Get total repairs count
    const [repairsResult] = await db.query(`
      SELECT COUNT(*) as total FROM repairs
    `);

    // Get repairs count by status categories
    const [pendingRepairsResult] = await db.query(`
      SELECT COUNT(*) as total FROM repairs WHERE status IN ('Pending', 'Completed', 'Cannot Repair', 'Picked Up')
    `);

    // Get low stock items count (items with less than 10 units)
    const [lowStockResult] = await db.query(`
      SELECT COUNT(*) AS total
      FROM (
        SELECT
          pr.name
        FROM
          purchases p
        JOIN
          product pr ON p.product_id = pr.product_id
        WHERE
          p.remaining_quantity < 10
        GROUP BY
          pr.name
      ) AS unique_low_stock_items
    `);

    // Calculate month-to-date revenue
    const currentDate = new Date();
    const firstDayOfMonth = format(startOfMonth(currentDate), 'yyyy-MM-dd');
    const lastDayOfMonth = format(endOfMonth(currentDate), 'yyyy-MM-dd');

    const [monthlyRevenueResult] = await db.query(`
      SELECT SUM(total) as total
      FROM invoice
      WHERE date BETWEEN ? AND ?
    `, [firstDayOfMonth, lastDayOfMonth]);

    res.status(200).json({
      status: 'success',
      data: {
        totalProducts: productsResult[0]?.total || 0,
        totalCustomers: customersResult[0]?.total || 0,
        totalSales: salesResult[0]?.total || 0,
        totalRevenue: revenueResult[0]?.total || 0,
        totalRepairs: repairsResult[0]?.total || 0,
        pendingRepairs: pendingRepairsResult[0]?.total || 0,
        lowStockItems: lowStockResult[0]?.total || 0,
        monthlyRevenue: monthlyRevenueResult[0]?.total || 0
      }
    });
  } catch (error) {
    console.error("Error in getDashboardSummary:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Get sales statistics with date filtering for reports
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

    let whereClause = '';
    const params = [];

    if (startDate && endDate) {
      whereClause = 'WHERE date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    // Get total sales count
    const [salesResult] = await db.query(`
      SELECT COUNT(*) as total FROM invoice ${whereClause}
    `, params);

    // Get total revenue
    const [revenueResult] = await db.query(`
      SELECT SUM(total) as total FROM invoice ${whereClause}
    `, params);

    // Calculate average order value
    const totalSales = salesResult[0]?.total || 0;
    const totalRevenue = revenueResult[0]?.total || 0;
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Calculate actual profit margin by comparing selling prices to buying prices
    let profitQuery = `
      SELECT
        SUM((s.quantity * pu.selling_price * (1 - s.discount / 100)) - (s.quantity * pu.buying_price)) AS profit
      FROM
        sales s
        JOIN purchases pu ON s.purchase_id = pu.purchase_id
        JOIN invoice i ON s.invoice_no = i.invoice_no
    `;

    // Add the same date filtering as used for other queries
    if (startDate && endDate) {
      profitQuery += ` WHERE i.date BETWEEN ? AND ?`;
    }

    const [profitResult] = await db.query(profitQuery, startDate && endDate ? [startDate, endDate] : []);

    const profitMargin = profitResult[0].profit || 0;

    res.status(200).json({
      status: 'success',
      data: {
        totalSales,
        totalRevenue,
        averageOrderValue,
        profitMargin
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

// Get sales data for charts (daily, weekly, monthly)
exports.getSalesChartData = async (req, res) => {
  try {
    const { period = 'weekly' } = req.query;
    let query = '';
    let params = [];

    const currentDate = new Date();

    if (period === 'daily') {
      // Last 7 days data
      query = `
        SELECT
          DATE_FORMAT(date, '%Y-%m-%d') as day,
          COUNT(*) as count,
          SUM(total) as revenue
        FROM
          invoice
        WHERE
          date >= ?
        GROUP BY
          day
        ORDER BY
          day ASC
      `;
      params = [format(subDays(currentDate, 7), 'yyyy-MM-dd')];
    } else if (period === 'weekly') {
      // Last 8 weeks data
      query = `
        SELECT
          YEARWEEK(date, 1) as week,
          MIN(DATE_FORMAT(date, '%Y-%m-%d')) as start_date,
          COUNT(*) as count,
          SUM(total) as revenue
        FROM
          invoice
        WHERE
          date >= ?
        GROUP BY
          week
        ORDER BY
          week ASC
        LIMIT 8
      `;
      params = [format(subDays(currentDate, 56), 'yyyy-MM-dd')];
    } else if (period === 'monthly') {
      // Last 6 months data
      query = `
        SELECT
          DATE_FORMAT(date, '%Y-%m') as month,
          COUNT(*) as count,
          SUM(total) as revenue
        FROM
          invoice
        WHERE
          date >= ?
        GROUP BY
          month
        ORDER BY
          month ASC
        LIMIT 6
      `;
      params = [format(subDays(currentDate, 180), 'yyyy-MM-dd')];
    }

    const [rows] = await db.query(query, params);

    res.status(200).json({
      status: 'success',
      data: rows
    });
  } catch (error) {
    console.error("Error in getSalesChartData:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Get repair status distribution
exports.getRepairStatusDistribution = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        status,
        COUNT(*) as count
      FROM
        repairs
      GROUP BY
        status
      ORDER BY
        count DESC
    `);

    res.status(200).json({
      status: 'success',
      data: rows
    });
  } catch (error) {
    console.error("Error in getRepairStatusDistribution:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Get top selling products
exports.getTopSellingProducts = async (req, res) => {
  try {
    const { limit = 5, startDate, endDate } = req.query;

    let query = `
      SELECT
        p.name,
        SUM(s.quantity) as total_quantity,
        SUM(s.quantity * pu.selling_price * (1 - s.discount/100)) as total_revenue
      FROM
        sales s
      JOIN
        product p ON s.product_id = p.product_id
      JOIN
        purchases pu ON s.purchase_id = pu.purchase_id
    `;

    const params = [];

    // Add date filtering if provided
    if (startDate && endDate) {
      query += `
        JOIN
          invoice i ON s.invoice_no = i.invoice_no
        WHERE
          i.date BETWEEN ? AND ?
      `;
      params.push(startDate, endDate);
    }

    query += `
      GROUP BY
        p.product_id, p.name
      ORDER BY
        total_quantity DESC
      LIMIT ?
    `;

    params.push(parseInt(limit));

    const [rows] = await db.query(query, params);

    res.status(200).json({
      status: 'success',
      data: rows
    });
  } catch (error) {
    console.error("Error in getTopSellingProducts:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Get low stock items
exports.getLowStockItems = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const [rows] = await db.query(`
      SELECT
        pr.name,
        MIN(p.remaining_quantity) AS remaining_quantity
      FROM
        purchases p
      JOIN
        product pr ON p.product_id = pr.product_id
      WHERE
        p.remaining_quantity < 10
      GROUP BY
        pr.name
      ORDER BY
        remaining_quantity ASC
      LIMIT ?
    `, [parseInt(limit)]);

    res.status(200).json({
      status: 'success',
      data: rows
    });
  } catch (error) {
    console.error("Error in getLowStockItems:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Get revenue by product category
exports.getRevenueByCategory = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = `
      SELECT
        c.name as category,
        SUM(s.quantity * pu.selling_price * (1 - s.discount/100)) as revenue
      FROM
        sales s
      JOIN
        product p ON s.product_id = p.product_id
      JOIN
        purchases pu ON s.purchase_id = pu.purchase_id
      LEFT JOIN
        category c ON p.category_id = c.category_id
    `;

    const params = [];

    // Add date filtering if provided
    if (startDate && endDate) {
      query += `
        JOIN
          invoice i ON s.invoice_no = i.invoice_no
        WHERE
          i.date BETWEEN ? AND ?
      `;
      params.push(startDate, endDate);
    }

    query += `
      GROUP BY
        c.category_id, c.name
      ORDER BY
        revenue DESC
    `;

    const [rows] = await db.query(query, params);

    res.status(200).json({
      status: 'success',
      data: rows
    });
  } catch (error) {
    console.error("Error in getRevenueByCategory:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Get purchase statistics with date filtering for reports
exports.getPurchaseStats = async (req, res) => {
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

    let whereClause = '';
    const params = [];

    if (startDate && endDate) {
      whereClause = 'WHERE date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    // Get total purchases count
    const [purchasesResult] = await db.query(`
      SELECT COUNT(*) as total FROM purchases ${whereClause}
    `, params);

    // Get total cost
    const [costResult] = await db.query(`
      SELECT SUM(buying_price * quantity) as total FROM purchases ${whereClause}
    `, params);

    // Calculate average purchase value
    const totalPurchases = purchasesResult[0]?.total || 0;
    const totalCost = costResult[0]?.total || 0;
    const averagePurchaseValue = totalPurchases > 0 ? totalCost / totalPurchases : 0;

    res.status(200).json({
      status: 'success',
      data: {
        totalPurchases,
        totalCost,
        averagePurchaseValue
      }
    });
  } catch (error) {
    console.error("Error in getPurchaseStats:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Get top suppliers by purchase volume and value
exports.getTopSuppliers = async (req, res) => {
  try {
    const { startDate, endDate, limit = 5 } = req.query;

    let query = `
      SELECT
        s.name as supplier_name,
        s.supplier_id,
        COUNT(p.purchase_id) as purchase_count,
        SUM(p.quantity) as total_quantity,
        SUM(p.buying_price * p.quantity) as total_value
      FROM
        purchases p
      JOIN
        product pr ON p.product_id = pr.product_id
      JOIN
        suppliers s ON pr.supplier_id = s.supplier_id
    `;

    const params = [];

    // Add date filtering if provided
    if (startDate && endDate) {
      query += `
        WHERE
          p.date BETWEEN ? AND ?
      `;
      params.push(startDate, endDate);
    }

    query += `
      GROUP BY
        s.supplier_id, s.name
      ORDER BY
        total_value DESC
      LIMIT ?
    `;

    params.push(parseInt(limit));

    const [rows] = await db.query(query, params);

    res.status(200).json({
      status: 'success',
      data: rows
    });
  } catch (error) {
    console.error("Error in getTopSuppliers:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Get purchase category breakdown
exports.getPurchaseCategoryBreakdown = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = `
      SELECT
        c.name as category,
        COUNT(p.purchase_id) as purchase_count,
        SUM(p.quantity) as total_quantity,
        SUM(p.buying_price * p.quantity) as total_cost
      FROM
        purchases p
      JOIN
        product pr ON p.product_id = pr.product_id
      LEFT JOIN
        category c ON pr.category_id = c.category_id
    `;

    const params = [];

    // Add date filtering if provided
    if (startDate && endDate) {
      query += `
        WHERE
          p.date BETWEEN ? AND ?
      `;
      params.push(startDate, endDate);
    }

    query += `
      GROUP BY
        c.category_id, c.name
      ORDER BY
        total_cost DESC
    `;

    const [rows] = await db.query(query, params);

    res.status(200).json({
      status: 'success',
      data: rows
    });
  } catch (error) {
    console.error("Error in getPurchaseCategoryBreakdown:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Get repair statistics with date filtering for reports
exports.getRepairStats = async (req, res) => {
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

    let whereClause = '';
    const params = [];

    if (startDate && endDate) {
      whereClause = 'WHERE date_received BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    // Get total repairs count
    const [repairsResult] = await db.query(`
      SELECT COUNT(*) as total FROM repairs ${whereClause}
    `, params);

    // Get completed repairs count
    const [completedResult] = await db.query(`
      SELECT COUNT(*) as total FROM repairs
      ${whereClause ? whereClause + ' AND' : 'WHERE'} status = 'Picked Up'
    `, params);

    // Get average repair time (in days) for completed repairs
    const [avgTimeResult] = await db.query(`
      SELECT AVG(DATEDIFF(date_completed, date_received)) as avg_days
      FROM repairs
      ${whereClause ? whereClause + ' AND' : 'WHERE'}
      status = 'Picked Up' AND date_completed IS NOT NULL
    `, params);

    // Get total revenue from repairs
    const [revenueResult] = await db.query(`
      SELECT SUM(estimated_cost + IFNULL(extra_expenses, 0) - IFNULL(advance_payment, 0)) as total
      FROM repairs
      ${whereClause ? whereClause + ' AND' : 'WHERE'} status = 'Picked Up'
    `, params);

    const totalRepairs = repairsResult[0]?.total || 0;
    const completedRepairs = completedResult[0]?.total || 0;
    const avgRepairTime = avgTimeResult[0]?.avg_days || 0;
    const totalRevenue = revenueResult[0]?.total || 0;

    res.status(200).json({
      status: 'success',
      data: {
        totalRepairs,
        completedRepairs,
        avgRepairTime,
        totalRevenue
      }
    });
  } catch (error) {
    console.error("Error in getRepairStats:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Get technician performance metrics
exports.getTechnicianPerformance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = `
      SELECT
        r.technician,
        u.Username as technician_name,
        COUNT(r.repair_id) as total_repairs,
        SUM(CASE WHEN r.status = 'Picked Up' THEN 1 ELSE 0 END) as completed_repairs,
        AVG(CASE WHEN r.status = 'Picked Up' AND r.date_completed IS NOT NULL
            THEN DATEDIFF(r.date_completed, r.date_received)
            ELSE NULL END) as avg_completion_days,
        SUM(CASE WHEN r.status = 'Picked Up'
            THEN r.estimated_cost + IFNULL(r.extra_expenses, 0) - IFNULL(r.advance_payment, 0)
            ELSE 0 END) as total_revenue
      FROM
        repairs r
      LEFT JOIN
        user u ON r.technician = u.User_ID
    `;

    const params = [];

    // Add date filtering if provided
    if (startDate && endDate) {
      query += `
        WHERE
          r.date_received BETWEEN ? AND ?
      `;
      params.push(startDate, endDate);
    }

    query += `
      GROUP BY
        r.technician, u.Username
      ORDER BY
        completed_repairs DESC
    `;

    const [rows] = await db.query(query, params);

    res.status(200).json({
      status: 'success',
      data: rows
    });
  } catch (error) {
    console.error("Error in getTechnicianPerformance:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Get device type analysis for repairs
exports.getDeviceTypeAnalysis = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = `
      SELECT
        device_type,
        COUNT(*) as count
      FROM
        repairs
    `;

    const params = [];

    // Add date filtering if provided
    if (startDate && endDate) {
      query += `
        WHERE
          date_received BETWEEN ? AND ?
      `;
      params.push(startDate, endDate);
    }

    query += `
      GROUP BY
        device_type
      ORDER BY
        count DESC
    `;

    const [rows] = await db.query(query, params);

    res.status(200).json({
      status: 'success',
      data: rows
    });
  } catch (error) {
    console.error("Error in getDeviceTypeAnalysis:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

/**
 * Get repair-related revenue for a specific date
 *
 * This endpoint retrieves both advance payments received and final payments collected
 * on the specified date for repair services.
 *
 * @route GET /dashboard/revenue-by-date
 * @param {string} date - The date to get revenue for (format: YYYY-MM-DD)
 * @returns {Object} JSON response with advance and due payments for the specified date
 */
exports.getRevenueByDate = async (req, res) => {
  try {
    const { date } = req.query;

    // Validate date parameter
    if (!date) {
      return res.status(400).json({
        status: 'fail',
        message: 'Date parameter is required (format: YYYY-MM-DD)'
      });
    }

    if (isNaN(new Date(date).getTime())) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid date format. Please use YYYY-MM-DD format.'
      });
    }

    // Query to get both advance payments and due payments on the specified date
    const query = `
      SELECT
          'advance' AS payment_type,
          date_received AS payment_date,
          SUM(advance_payment) AS amount
      FROM
          repairs
      WHERE
          date_received = ?
      GROUP BY
          date_received

      UNION ALL

      SELECT
          'due' AS payment_type,
          date_completed AS payment_date,
          SUM(estimated_cost + IFNULL(extra_expenses, 0) - advance_payment) AS amount
      FROM
          repairs
      WHERE
          date_completed = ?
          AND status = 'Picked Up'
      GROUP BY
          date_completed;
    `;

    const [rows] = await db.query(query, [date, date]);

    // Format the response
    const result = {
      date: date,
      advance_payment: 0,
      due_payment: 0,
      total_revenue: 0
    };

    // Process the results
    rows.forEach(row => {
      if (row.payment_type === 'advance') {
        result.advance_payment = parseFloat(row.amount) || 0;
      } else if (row.payment_type === 'due') {
        result.due_payment = parseFloat(row.amount) || 0;
      }
    });

    // Calculate total revenue
    result.total_revenue = result.advance_payment + result.due_payment;

    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    console.error("Error in getRevenueByDate:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};