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
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle authentication errors
API.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // If we get a 401 error, redirect to login page
    if (error.response && error.response.status === 401) {
      // Clear any existing tokens
      localStorage.removeItem('token');
      
      // Redirect to login page
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default API;