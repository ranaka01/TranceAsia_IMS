const db = require('../../db');
const { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } = require('date-fns');

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
    
    // Get pending repairs count
    const [pendingRepairsResult] = await db.query(`
      SELECT COUNT(*) as total FROM repairs WHERE status IN ('Pending', 'In Progress', 'Waiting for Parts')
    `);
    
    // Get low stock items count (items with less than 5 units)
    const [lowStockResult] = await db.query(`
      SELECT COUNT(DISTINCT p.product_id) as total
      FROM product p
      LEFT JOIN purchases pur ON p.product_id = pur.product_id
      GROUP BY p.product_id
      HAVING SUM(pur.remaining_quantity) < 5
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
        totalProducts: productsResult[0].total || 0,
        totalCustomers: customersResult[0].total || 0,
        totalSales: salesResult[0].total || 0,
        totalRevenue: revenueResult[0].total || 0,
        totalRepairs: repairsResult[0].total || 0,
        pendingRepairs: pendingRepairsResult[0].total || 0,
        lowStockItems: lowStockResult[0]?.total || 0,
        monthlyRevenue: monthlyRevenueResult[0].total || 0
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
    const { limit = 5 } = req.query;
    
    const [rows] = await db.query(`
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
      GROUP BY 
        p.product_id
      ORDER BY 
        total_quantity DESC
      LIMIT ?
    `, [parseInt(limit)]);
    
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
    const { threshold = 5, limit = 5 } = req.query;
    
    const [rows] = await db.query(`
      SELECT 
        p.product_id,
        p.name,
        c.name as category,
        COALESCE(SUM(pur.remaining_quantity), 0) as remaining_quantity
      FROM 
        product p
      LEFT JOIN 
        category c ON p.category_id = c.category_id
      LEFT JOIN 
        purchases pur ON p.product_id = pur.product_id
      WHERE 
        p.is_active = 1
      GROUP BY 
        p.product_id, p.name, c.name
      HAVING 
        remaining_quantity < ?
      ORDER BY 
        remaining_quantity ASC
      LIMIT ?
    `, [parseInt(threshold), parseInt(limit)]);
    
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
    const [rows] = await db.query(`
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
      GROUP BY 
        c.category_id
      ORDER BY 
        revenue DESC
    `);
    
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
