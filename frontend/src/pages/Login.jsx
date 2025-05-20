import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { MdVisibility, MdVisibilityOff } from 'react-icons/md';
import API from '../utils/api';
import ForgotPasswordModal from '../components/ForgotPasswordModal';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');

  const navigate = useNavigate();

  // Try to load the company logo
  useEffect(() => {
    try {
      // Try to use the logo from public directory
      setLogoUrl('/logo.svg');
    } catch (error) {
      console.error('Error loading logo:', error);
      // Fallback to Vite logo if there's an error
      setLogoUrl('/vite.svg');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError('Please enter both email and password');
      setIsLoading(false);
      return;
    }

    try {
      const response = await API.post('users/login', { email, password });
      console.log('Login response:', response.data); // Debug response

      // Check if the response contains the token in the expected structure
      if (!response.data || !response.data.data || !response.data.data.token) {
        throw new Error('Invalid response format. Token not found.');
      }

      // Get token from response - updated to match the response structure
      const token = response.data.data.token;

      if (!token || typeof token !== 'string') {
        throw new Error('Invalid token received from server');
      }

      // Save token
      localStorage.setItem('token', token);

      // Decode token
      const decodedToken = jwtDecode(token);
      const userRole = decodedToken.role;

      // Redirect based on role
      if (userRole === 'Admin') {
        navigate('/admin');
      } else if (userRole === 'Cashier') {
        // Redirect Cashier users directly to the Transactions page
        navigate('/cashier/transactions');
      } else if (userRole === 'Technician') {
        navigate('/technician');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Login error:', err);

      // Check for specific error types and provide more user-friendly messages
      if (err.response && err.response.data) {
        // Handle specific error messages from the server
        if (err.response.status === 401) {
          // Authentication failure - could be invalid email or password
          if (err.response.data.message === 'Invalid email or password') {
            // Check if the email exists in the error message
            if (email && err.response.data.emailExists) {
              setError('The password you entered is incorrect. Please try again.');
            } else {
              // We don't want to reveal if an email exists or not for security reasons
              setError('Invalid email or password. Please check your credentials and try again.');
            }
          } else if (err.response.data.message === 'User account has been deactivated') {
            setError('Your account has been deactivated. Please contact an administrator.');
          } else {
            setError(err.response.data.message);
          }
        } else {
          // For other types of errors, use the server's message
          setError(err.response.data.message || 'Login failed. Please try again.');
        }
      } else if (err.message) {
        // Client-side errors (network issues, etc.)
        if (err.message.includes('Network Error')) {
          setError('Unable to connect to the server. Please check your internet connection and try again.');
        } else {
          setError(err.message);
        }
      } else {
        // Generic fallback error
        setError('Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-blue-500 relative">
      {/* Background pattern overlay */}
      <div className="absolute inset-0 bg-opacity-10 bg-white"
           style={{
             backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z\' fill=\'%23ffffff\' fill-opacity=\'0.1\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
             backgroundSize: '100px 100px'
           }}>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md relative z-10 border border-gray-100">
        {/* Logo and Header */}
        <div className="flex flex-col items-center mb-8">
          {logoUrl ? (
            <img src={logoUrl} alt="Trance Asia Computers" className="h-16 mb-4" />
          ) : (
            <div className="h-16 w-16 bg-gradient-to-r from-indigo-600 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4">
              TAC
            </div>
          )}
          <h2 className="text-2xl font-bold text-center text-indigo-700">Trance Asia Computers</h2>
          <h3 className="text-lg text-gray-600 mt-2">Login to Your Account</h3>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username Field */}
          <div>
            <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              placeholder="Enter your email"
              required
            />
          </div>

          {/* Password Field with Toggle */}
          <div>
            <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-indigo-500 focus:outline-none"
                tabIndex="-1"
              >
                {showPassword ? (
                  <MdVisibilityOff className="h-5 w-5" />
                ) : (
                  <MdVisibility className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-lg font-medium text-white bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 shadow-md transition-all ${
              isLoading ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging in...
              </div>
            ) : (
              'Login'
            )}
          </button>

          {/* Forgot Password Link */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsForgotPasswordOpen(true)}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium transition-colors"
            >
              Forgot Password?
            </button>
          </div>
        </form>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
      />
    </div>
  );
};

export default Login;