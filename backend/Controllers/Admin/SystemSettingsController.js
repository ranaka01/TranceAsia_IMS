const SystemSettings = require('../../Models/Admin/SystemSettingsModel');

// Get all system settings
exports.getAllSettings = async (req, res) => {
  try {
    const settings = await SystemSettings.getAll();
    
    res.status(200).json({
      status: 'success',
      data: {
        settings
      }
    });
  } catch (error) {
    console.error("Error in getAllSettings:", error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Get a specific setting by key
exports.getSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const setting = await SystemSettings.get(key);
    
    if (!setting) {
      return res.status(404).json({
        status: 'fail',
        message: `Setting with key '${key}' not found`
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        key,
        setting
      }
    });
  } catch (error) {
    console.error(`Error in getSetting for key ${req.params.key}:`, error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Update a setting
exports.updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;
    
    if (value === undefined) {
      return res.status(400).json({
        status: 'fail',
        message: 'Setting value is required'
      });
    }
    
    // Special validation for sale_undo_time_limit
    if (key === 'sale_undo_time_limit') {
      const minutes = parseInt(value, 10);
      if (isNaN(minutes) || minutes < 1 || minutes > 60) {
        return res.status(400).json({
          status: 'fail',
          message: 'Sale undo time limit must be between 1 and 60 minutes'
        });
      }
    }
    
    const updatedSetting = await SystemSettings.update(key, value, description);
    
    res.status(200).json({
      status: 'success',
      data: {
        key,
        setting: updatedSetting
      }
    });
  } catch (error) {
    console.error(`Error in updateSetting for key ${req.params.key}:`, error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};

// Delete a setting
exports.deleteSetting = async (req, res) => {
  try {
    const { key } = req.params;
    
    // Prevent deletion of critical settings
    const criticalSettings = ['sale_undo_time_limit', 'company_name', 'company_address', 'company_phone', 'company_email'];
    if (criticalSettings.includes(key)) {
      return res.status(400).json({
        status: 'fail',
        message: `Cannot delete critical setting '${key}'`
      });
    }
    
    const success = await SystemSettings.delete(key);
    
    if (!success) {
      return res.status(404).json({
        status: 'fail',
        message: `Setting with key '${key}' not found`
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: `Setting '${key}' deleted successfully`
    });
  } catch (error) {
    console.error(`Error in deleteSetting for key ${req.params.key}:`, error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
};
