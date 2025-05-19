import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import API from '../utils/api';
import ForgotPasswordModal from '../components/ForgotPasswordModal';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const navigate = useNavigate();

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
        navigate('/cashier');
      } else if (userRole === 'Technician') {
        navigate('/technician');
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Login error:', err);

      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-800">Trance Asia Computers</h2>
        <h3 className="text-xl font-semibold mb-6 text-center">Login to Your Account</h3>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2 px-4 rounded font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
              isLoading ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsForgotPasswordOpen(true)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
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