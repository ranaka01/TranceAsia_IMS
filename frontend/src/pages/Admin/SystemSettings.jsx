import React, { useState, useEffect } from "react";
import API from "../../utils/api";
import { toast } from "react-toastify";
import { FaSave, FaUndo, FaInfoCircle } from "react-icons/fa";
import Button from "../../components/UI/Button";

const SystemSettings = () => {
  const [settings, setSettings] = useState({});
  const [formValues, setFormValues] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // Load settings when component mounts
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await API.get("settings/");
        const data = response.data?.data?.settings || {};
        setSettings(data);
        
        // Initialize form values
        const initialValues = {};
        Object.keys(data).forEach(key => {
          initialValues[key] = data[key].value;
        });
        setFormValues(initialValues);
      } catch (err) {
        console.error("Error fetching settings:", err);
        setError("Failed to load settings. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Handle input change
  const handleInputChange = (key, value) => {
    setFormValues(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      // Save each changed setting
      const changedSettings = Object.keys(formValues).filter(
        key => formValues[key] !== settings[key]?.value
      );
      
      if (changedSettings.length === 0) {
        toast.info("No changes to save");
        setIsSaving(false);
        return;
      }
      
      // Process each changed setting
      const promises = changedSettings.map(key => 
        API.patch(`settings/${key}`, { value: formValues[key] })
      );
      
      await Promise.all(promises);
      
      toast.success("Settings saved successfully");
      
      // Refresh settings
      const response = await API.get("settings/");
      const data = response.data?.data?.settings || {};
      setSettings(data);
    } catch (err) {
      console.error("Error saving settings:", err);
      toast.error(err.response?.data?.message || "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  // Reset form to current settings
  const handleReset = () => {
    const initialValues = {};
    Object.keys(settings).forEach(key => {
      initialValues[key] = settings[key].value;
    });
    setFormValues(initialValues);
    toast.info("Form reset to current settings");
  };

  // Validate sale undo time limit
  const validateUndoTimeLimit = (value) => {
    const minutes = parseInt(value, 10);
    return !isNaN(minutes) && minutes >= 1 && minutes <= 60;
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">System Settings</h1>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-medium mb-4">Sale Settings</h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sale Undo Time Limit (minutes)
                </label>
                <div className="flex items-center">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={formValues.sale_undo_time_limit || ""}
                    onChange={(e) => handleInputChange("sale_undo_time_limit", e.target.value)}
                    className={`block w-32 px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                      !validateUndoTimeLimit(formValues.sale_undo_time_limit)
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  <div className="ml-4 text-sm text-gray-500 flex items-center">
                    <FaInfoCircle className="mr-1 text-blue-500" />
                    Valid range: 1-60 minutes
                  </div>
                </div>
                {!validateUndoTimeLimit(formValues.sale_undo_time_limit) && (
                  <p className="mt-1 text-sm text-red-600">
                    Time limit must be between 1 and 60 minutes
                  </p>
                )}
                <p className="mt-2 text-sm text-gray-500">
                  This setting controls how long users have to undo a sale after it's created.
                </p>
              </div>

              <h2 className="text-lg font-medium mb-4 mt-8">Company Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    value={formValues.company_name || ""}
                    onChange={(e) => handleInputChange("company_name", e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Phone
                  </label>
                  <input
                    type="text"
                    value={formValues.company_phone || ""}
                    onChange={(e) => handleInputChange("company_phone", e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Email
                  </label>
                  <input
                    type="email"
                    value={formValues.company_email || ""}
                    onChange={(e) => handleInputChange("company_email", e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Address
                  </label>
                  <textarea
                    value={formValues.company_address || ""}
                    onChange={(e) => handleInputChange("company_address", e.target.value)}
                    rows="2"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  ></textarea>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={handleReset}
                className="bg-gray-300 text-gray-800 py-2 px-4 rounded hover:bg-gray-400 transition-colors flex items-center"
              >
                <FaUndo className="mr-2" />
                Reset
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSaving || !validateUndoTimeLimit(formValues.sale_undo_time_limit)}
                className={`bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors flex items-center ${
                  isSaving || !validateUndoTimeLimit(formValues.sale_undo_time_limit)
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                {isSaving ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent mr-2"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave className="mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default SystemSettings;
