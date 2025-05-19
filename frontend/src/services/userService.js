import API from '../utils/api';

// Get all users
export const getAllUsers = async () => {
  try {
    const response = await API.get('/users');
    return response.data.data.users;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

// Get a user by ID
export const getUserById = async (id) => {
  try {
    const response = await API.get(`/users/${id}`);
    return response.data.data.user;
  } catch (error) {
    console.error(`Error fetching user with ID ${id}:`, error);
    throw error;
  }
};

// Get all technicians (users with technician role)
export const getAllTechnicians = async () => {
  try {
    console.log('Fetching technicians from API...');
    const response = await API.get('/users/technicians');
    console.log('Technicians API response:', response.data);

    // Check if the response has the expected structure
    if (response.data && response.data.data && Array.isArray(response.data.data.technicians)) {
      return response.data.data.technicians;
    } else {
      console.warn('Unexpected technicians API response format:', response.data);
      // Try to extract technicians from different response formats
      if (response.data && Array.isArray(response.data.technicians)) {
        return response.data.technicians;
      } else if (response.data && Array.isArray(response.data)) {
        return response.data;
      }
      // Return empty array if we can't find technicians
      return [];
    }
  } catch (error) {
    console.error('Error fetching technicians:', error);
    console.error('Error details:', error.response?.data || error.message);
    // Return empty array instead of throwing to prevent UI from breaking
    return [];
  }
};

// Update user status (active/inactive)
export const updateUserStatus = async (id, isActive) => {
  try {
    const response = await API.patch(`/users/${id}/status`, { is_active: isActive });
    return response.data;
  } catch (error) {
    console.error(`Error updating status for user with ID ${id}:`, error);
    throw error;
  }
};

// Create a new user
export const createUser = async (userData) => {
  try {
    const response = await API.post('/users/register-user', userData);
    return response.data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Delete a user
export const deleteUser = async (id) => {
  try {
    const response = await API.delete(`/users/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting user with ID ${id}:`, error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (id, profileData) => {
  try {
    const response = await API.patch(`/users/${id}/profile`, profileData);
    return response.data;
  } catch (error) {
    console.error(`Error updating profile for user with ID ${id}:`, error);
    throw error;
  }
};
