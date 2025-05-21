const SaleUndoLog = require('../../Models/Admin/SaleUndoLogModel');
const { format } = require('date-fns');
const { Parser } = require('json2csv');

// Get all undo logs with optional filtering
exports.getAllUndoLogs = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      userId,
      reasonType,
      page = 1,
      limit = 50
    } = req.query;

    const options = {
      startDate: startDate || null,
      endDate: endDate || null,
      userId: userId || null,
      reasonType: reasonType || null,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
    };

    const { logs, totalCount, totalPages, currentPage } = await SaleUndoLog.findAll(options);

    res.status(200).json({
      status: 'success',
      results: logs.length,
      pagination: {
        totalCount,
        totalPages,
        currentPage,
        limit: options.limit
      },
      data: {
        logs
      }
    });
  } catch (error) {
    console.error("Error in getAllUndoLogs:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Get a specific undo log by ID
exports.getUndoLogById = async (req, res) => {
  try {
    const log = await SaleUndoLog.findById(req.params.id);

    if (!log) {
      return res.status(404).json({
        status: 'fail',
        message: 'No undo log found with that ID'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        log
      }
    });
  } catch (error) {
    console.error("Error in getUndoLogById:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Export undo logs to CSV
exports.exportUndoLogsCSV = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      userId,
      reasonType
    } = req.query;

    const options = {
      startDate: startDate || null,
      endDate: endDate || null,
      userId: userId || null,
      reasonType: reasonType || null,
      page: 1,
      limit: 1000 // Get a larger set for export
    };

    const { logs } = await SaleUndoLog.findAll(options);

    // Prepare data for CSV export
    const csvData = logs.map(log => {
      const saleData = log.sale_data;
      return {
        'ID': log.id,
        'Invoice No': log.invoice_no,
        'User': log.user_name,
        'Undo Date': format(new Date(log.undo_date), 'yyyy-MM-dd HH:mm:ss'),
        'Reason Type': log.reason_type,
        'Reason Details': log.reason_details || '',
        'Customer': saleData.customer_name || 'Walk-in Customer',
        'Total Amount': saleData.total || 0,
        'Items Count': saleData.items?.length || 0,
        'Sale Date': saleData.date ? format(new Date(saleData.date), 'yyyy-MM-dd HH:mm:ss') : ''
      };
    });

    // Convert to CSV
    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(csvData);

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=undo_logs_${format(new Date(), 'yyyy-MM-dd')}.csv`);

    // Send the CSV data
    res.status(200).send(csv);
  } catch (error) {
    console.error("Error in exportUndoLogsCSV:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};
