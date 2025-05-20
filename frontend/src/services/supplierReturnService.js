import API from '../utils/api';

// Get all supplier returns with optional search
export const getAllSupplierReturns = async (search = '') => {
  try {
    const response = await API.get(`/supplier-returns${search ? `?search=${search}` : ''}`);
    return response.data.data.returns;
  } catch (error) {
    console.error('Error fetching supplier returns:', error);
    throw error;
  }
};

// Get a supplier return by ID
export const getSupplierReturnById = async (id) => {
  try {
    const response = await API.get(`/supplier-returns/${id}`);
    return response.data.data.return;
  } catch (error) {
    console.error(`Error fetching supplier return with ID ${id}:`, error);
    throw error;
  }
};

// Get product details by purchase ID
export const getProductDetailsByPurchaseId = async (purchaseId) => {
  try {
    const response = await API.get(`/supplier-returns/purchase/${purchaseId}`);
    return response.data.data.productDetails;
  } catch (error) {
    console.error(`Error fetching product details for purchase ID ${purchaseId}:`, error);
    throw error;
  }
};

// Create a new supplier return
export const createSupplierReturn = async (returnData) => {
  try {
    const response = await API.post('/supplier-returns', returnData);
    return response.data.data.return;
  } catch (error) {
    console.error('Error creating supplier return:', error);
    throw error;
  }
};

// Update a supplier return
export const updateSupplierReturn = async (id, returnData) => {
  try {
    const response = await API.patch(`/supplier-returns/${id}`, returnData);
    return response.data.data.return;
  } catch (error) {
    console.error(`Error updating supplier return with ID ${id}:`, error);
    throw error;
  }
};
