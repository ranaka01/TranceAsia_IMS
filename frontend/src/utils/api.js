import axios from 'axios';

// Create axios instance with base URL
const API = axios.create({
  baseURL: 'http://localhost:5000',
  timeout: 10000
});

// Add a request interceptor to include the auth token in all requests
API.interceptors.request.use(
  (config) => {
    // Get the token from localStorage
    const token = localStorage.getItem('token');

    // If token exists, add it to the authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Adding auth token to request:', config.url);
    } else {
      console.log('No auth token available for request:', config.url);
    }

    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle authentication errors
API.interceptors.response.use(
  (response) => {
    console.log('Response received for:', response.config.url, 'Status:', response.status);
    return response;
  },
  (error) => {
    console.error('Response error for:', error.config?.url, 'Status:', error.response?.status);

    // Handle 401 Unauthorized errors (invalid or expired token)
    if (error.response && error.response.status === 401) {
      // Get the error message
      const errorMessage = error.response.data?.message || error.response.data?.status === 'fail' && error.response.data?.message;
      console.error('Authentication error:', errorMessage);

      // Display notification to user if account is deactivated
      if (errorMessage === 'User account has been deactivated') {
        // Show a more specific message for deactivated accounts
        alert('Your account has been deactivated. Please contact your administrator.');
      }

      // Clear any existing tokens
      localStorage.removeItem('token');

      // Redirect to login page
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default API;