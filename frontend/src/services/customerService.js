import API from '../utils/api';

// Get all customers
export const getAllCustomers = async (search = '') => {
  try {
    const response = await API.get(`/customers${search ? `?search=${search}` : ''}`);
    return response.data.data.customers;
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw error;
  }
};

// Get a customer by ID
export const getCustomerById = async (id) => {
  try {
    const response = await API.get(`/customers/${id}`);
    return response.data.data.customer;
  } catch (error) {
    console.error(`Error fetching customer with ID ${id}:`, error);
    throw error;
  }
};

// Find customer by exact phone number
export const findCustomerByPhone = async (phone) => {
  try {
    const response = await API.get(`/customers/phone/${encodeURIComponent(phone)}`);
    return response.data.data.customer;
  } catch (error) {
    console.error(`Error finding customer with phone ${phone}:`, error);
    throw error;
  }
};

// Search customers by partial phone number
export const searchCustomersByPhone = async (partialPhone) => {
  try {
    if (!partialPhone || partialPhone.length < 3) {
      return [];
    }

    // Use the search parameter to find customers with matching phone numbers
    const response = await API.get(`/customers?search=${encodeURIComponent(partialPhone)}`);

    // Filter results to only include those where the phone number contains the search term
    const customers = response.data.data.customers || [];
    const filteredCustomers = customers.filter(customer =>
      customer.phone && customer.phone.includes(partialPhone)
    );

    return filteredCustomers;
  } catch (error) {
    console.error(`Error searching customers with partial phone ${partialPhone}:`, error);
    // Return empty array instead of throwing to prevent UI from breaking
    return [];
  }
};

// Create a new customer
export const createCustomer = async (customerData) => {
  try {
    const response = await API.post('/customers', customerData);
    return response.data.data.customer;
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
};

// Update a customer
export const updateCustomer = async (id, customerData) => {
  try {
    const response = await API.patch(`/customers/${id}`, customerData);
    return response.data.data.customer;
  } catch (error) {
    console.error(`Error updating customer with ID ${id}:`, error);
    throw error;
  }
};

// Delete a customer
export const deleteCustomer = async (id) => {
  try {
    const response = await API.delete(`/customers/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting customer with ID ${id}:`, error);
    throw error;
  }
};
