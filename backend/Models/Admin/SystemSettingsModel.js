const db = require('../../db');

class SystemSettings {
  // Get all settings
  static async getAll() {
    try {
      const [rows] = await db.query('SELECT * FROM system_settings ORDER BY setting_key');
      
      // Convert to key-value object for easier access
      const settings = {};
      rows.forEach(row => {
        settings[row.setting_key] = {
          value: row.setting_value,
          description: row.setting_description,
          updated_at: row.updated_at
        };
      });
      
      return settings;
    } catch (error) {
      throw new Error(`Error fetching system settings: ${error.message}`);
    }
  }
  
  // Get a specific setting by key
  static async get(key) {
    try {
      const [rows] = await db.query(
        'SELECT * FROM system_settings WHERE setting_key = ?',
        [key]
      );
      
      if (rows.length === 0) {
        return null;
      }
      
      return {
        value: rows[0].setting_value,
        description: rows[0].setting_description,
        updated_at: rows[0].updated_at
      };
    } catch (error) {
      throw new Error(`Error fetching setting ${key}: ${error.message}`);
    }
  }
  
  // Update a setting
  static async update(key, value, description = null) {
    try {
      // Check if setting exists
      const [existingRows] = await db.query(
        'SELECT * FROM system_settings WHERE setting_key = ?',
        [key]
      );
      
      if (existingRows.length === 0) {
        // Create new setting
        await db.query(
          'INSERT INTO system_settings (setting_key, setting_value, setting_description) VALUES (?, ?, ?)',
          [key, value, description]
        );
      } else {
        // Update existing setting
        const updateQuery = description !== null
          ? 'UPDATE system_settings SET setting_value = ?, setting_description = ? WHERE setting_key = ?'
          : 'UPDATE system_settings SET setting_value = ? WHERE setting_key = ?';
        
        const params = description !== null
          ? [value, description, key]
          : [value, key];
        
        await db.query(updateQuery, params);
      }
      
      return await this.get(key);
    } catch (error) {
      throw new Error(`Error updating setting ${key}: ${error.message}`);
    }
  }
  
  // Delete a setting
  static async delete(key) {
    try {
      const [result] = await db.query(
        'DELETE FROM system_settings WHERE setting_key = ?',
        [key]
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error deleting setting ${key}: ${error.message}`);
    }
  }
  
  // Get the sale undo time limit in minutes
  static async getSaleUndoTimeLimit() {
    try {
      const setting = await this.get('sale_undo_time_limit');
      if (!setting) {
        // Default to 10 minutes if not set
        return 10;
      }
      
      const minutes = parseInt(setting.value, 10);
      // Ensure the value is between 1 and 60 minutes
      return Math.min(Math.max(minutes, 1), 60);
    } catch (error) {
      console.error('Error getting sale undo time limit:', error);
      // Default to 10 minutes on error
      return 10;
    }
  }
}

module.exports = SystemSettings;
