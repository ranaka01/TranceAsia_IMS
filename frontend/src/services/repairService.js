import API from '../utils/api';

// Get all repairs with optional search
export const getAllRepairs = async (search = '') => {
  try {
    const response = await API.get(`/repairs${search ? `?search=${search}` : ''}`);
    return response.data.data.repairs;
  } catch (error) {
    console.error('Error fetching repairs:', error);
    throw error;
  }
};

// Get a repair by ID
export const getRepairById = async (id) => {
  try {
    const response = await API.get(`/repairs/${id}`);
    return response.data.data.repair;
  } catch (error) {
    console.error(`Error fetching repair with ID ${id}:`, error);
    throw error;
  }
};

// Create a new repair
export const createRepair = async (repairData) => {
  try {
    // Ensure serialNumber is a string and format currency values
    console.log('Original repair data:', repairData);
    console.log('extraExpenses before processing:', repairData.extraExpenses, 'type:', typeof repairData.extraExpenses);

    // Helper function to safely parse and format currency values
    const formatCurrency = (value) => {
      try {
        if (!value || value === "0.00") return "0.00";
        const numericValue = value.toString().replace(/,/g, '');
        if (isNaN(numericValue)) return "0.00";
        return parseFloat(numericValue).toFixed(2);
      } catch (error) {
        console.error('Error formatting currency value:', value, error);
        return "0.00";
      }
    };

    const sanitizedData = {
      ...repairData,
      serialNumber: String(repairData.serialNumber || ''),
      // Ensure currency values are properly formatted and converted to numeric values
      estimatedCost: formatCurrency(repairData.estimatedCost),
      advancePayment: formatCurrency(repairData.advancePayment),
      extraExpenses: formatCurrency(repairData.extraExpenses)
    };

    console.log('extraExpenses after processing:', sanitizedData.extraExpenses, 'type:', typeof sanitizedData.extraExpenses);
    console.log('Sending repair data to API:', sanitizedData);
    const response = await API.post(`/repairs`, sanitizedData);
    return response.data.data.repairId;
  } catch (error) {
    console.error('Error creating repair:', error);
    throw error;
  }
};

// Update a repair
export const updateRepair = async (id, repairData) => {
  try {
    // Ensure serialNumber is a string and format currency values
    console.log('Original repair data for update:', repairData);
    console.log('extraExpenses before processing (update):', repairData.extraExpenses, 'type:', typeof repairData.extraExpenses);

    // Helper function to safely parse and format currency values
    const formatCurrency = (value) => {
      try {
        if (!value || value === "0.00") return "0.00";
        const numericValue = value.toString().replace(/,/g, '');
        if (isNaN(numericValue)) return "0.00";
        return parseFloat(numericValue).toFixed(2);
      } catch (error) {
        console.error('Error formatting currency value:', value, error);
        return "0.00";
      }
    };

    const sanitizedData = {
      ...repairData,
      serialNumber: String(repairData.serialNumber || ''),
      // Ensure currency values are properly formatted and converted to numeric values
      estimatedCost: formatCurrency(repairData.estimatedCost),
      advancePayment: formatCurrency(repairData.advancePayment),
      extraExpenses: formatCurrency(repairData.extraExpenses)
    };

    console.log('extraExpenses after processing (update):', sanitizedData.extraExpenses, 'type:', typeof sanitizedData.extraExpenses);
    console.log(`Updating repair ID ${id} with data:`, sanitizedData);
    const response = await API.patch(`/repairs/${id}`, sanitizedData);
    return response.data;
  } catch (error) {
    console.error(`Error updating repair with ID ${id}:`, error);
    throw error;
  }
};

// Update repair status
export const updateRepairStatus = async (id, status) => {
  try {
    console.log(`API call: Updating repair #${id} status to "${status}"`);

    // Ensure status is a string
    const statusStr = String(status).trim();

    if (!statusStr) {
      throw new Error("Status cannot be empty");
    }

    // Make the API call with the status in the request body
    // Note: The validation is now handled in the frontend components
    // to avoid circular dependencies and browser compatibility issues
    const response = await API.patch(`/repairs/${id}/status`, { status: statusStr });

    console.log(`API response for status update:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error updating status for repair with ID ${id} to "${status}":`, error);
    throw error;
  }
};

// Delete a repair
export const deleteRepair = async (id) => {
  try {
    const response = await API.delete(`/repairs/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting repair with ID ${id}:`, error);
    throw error;
  }
};

// Check warranty by serial number
export const checkWarrantyBySerialNumber = async (serialNumber) => {
  try {
    // Ensure serialNumber is a string
    const serialNumberStr = String(serialNumber || '');

    if (!serialNumberStr.trim()) {
      throw new Error('Serial number is required');
    }

    console.log(`Checking warranty for serial number: ${serialNumberStr}`);
    const response = await API.get(`/repairs/warranty/${encodeURIComponent(serialNumberStr)}`);
    return response.data.data.warrantyInfo;
  } catch (error) {
    console.error(`Error checking warranty for serial number ${serialNumber}:`, error);
    throw error;
  }
};

// Search for serial numbers
export const searchSerialNumbers = async (query) => {
  try {
    // Ensure query is a string
    const queryStr = String(query || '');

    if (!queryStr.trim()) {
      return [];
    }

    console.log(`Searching for serial numbers with query: ${queryStr}`);
    const response = await API.get(`/repairs/search/serial-numbers?query=${encodeURIComponent(queryStr)}`);
    return response.data.data.serialNumbers || [];
  } catch (error) {
    console.error(`Error searching for serial numbers with query ${query}:`, error);
    throw error;
  }
};
