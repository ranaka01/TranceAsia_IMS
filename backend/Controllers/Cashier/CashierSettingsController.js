const SystemSettings = require('../../Models/Admin/SystemSettingsModel');

// Get the sale undo time limit for cashiers
exports.getSaleUndoTimeLimit = async (req, res) => {
  try {
    const timeLimit = await SystemSettings.getSaleUndoTimeLimit();
    
    res.status(200).json({
      status: 'success',
      data: {
        timeLimit
      }
    });
  } catch (error) {
    console.error("Error in getSaleUndoTimeLimit:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};
