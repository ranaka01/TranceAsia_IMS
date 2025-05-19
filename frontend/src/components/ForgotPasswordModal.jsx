import React, { useState } from 'react';
import API from '../utils/api';
import { toast } from 'react-toastify';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Reset all state when modal is closed
  const handleClose = () => {
    setStep(1);
    setEmail('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccessMessage('');
    onClose();
  };

  // Handle email submission (Step 1)
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email) {
      setError('Please enter your email address');
      setIsLoading(false);
      return;
    }

    try {
      const response = await API.post('/users/forgot-password', { email });
      setSuccessMessage(response.data.message || 'OTP sent to your email address');
      setStep(2);
    } catch (err) {
      console.error('Error requesting OTP:', err);
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP verification (Step 2)
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!otp) {
      setError('Please enter the OTP sent to your email');
      setIsLoading(false);
      return;
    }

    try {
      const response = await API.post('/users/verify-otp', { email, otp });
      setSuccessMessage(response.data.message || 'OTP verified successfully');
      setStep(3);
    } catch (err) {
      console.error('Error verifying OTP:', err);
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password reset (Step 3)
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!newPassword) {
      setError('Please enter a new password');
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    try {
      const response = await API.post('/users/reset-password', {
        email,
        otp,
        newPassword
      });
      
      setSuccessMessage(response.data.message || 'Password reset successfully');
      toast.success('Password reset successfully! You can now log in with your new password.');
      
      // Close modal after a short delay
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      console.error('Error resetting password:', err);
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-100 bg-opacity-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-800">Trance Asia Computers</h2>
        
        {/* Step 1: Email Verification */}
        {step === 1 && (
          <>
            <h3 className="text-xl font-semibold mb-6 text-center">Forgot Password</h3>
            <p className="mb-4 text-gray-600 text-center">
              Enter your email address and we'll send you a verification code to reset your password.
            </p>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
            
            <form onSubmit={handleEmailSubmit}>
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
                  disabled={isLoading}
                />
              </div>
              
              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={handleClose}
                  className="py-2 px-4 border border-gray-300 rounded font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="py-2 px-4 rounded font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                  {isLoading ? 'Sending...' : 'Send OTP'}
                </button>
              </div>
            </form>
          </>
        )}
        
        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <>
            <h3 className="text-xl font-semibold mb-6 text-center">Enter Verification Code</h3>
            
            {successMessage && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                {successMessage}
              </div>
            )}
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
            
            <p className="mb-4 text-gray-600 text-center">
              We've sent a 6-digit verification code to <strong>{email}</strong>.
              Please enter it below.
            </p>
            
            <form onSubmit={handleOtpSubmit}>
              <div className="mb-4">
                <label htmlFor="otp" className="block text-gray-700 font-medium mb-2">
                  Verification Code (OTP)
                </label>
                <input
                  type="text"
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="py-2 px-4 border border-gray-300 rounded font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
                  disabled={isLoading}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="py-2 px-4 rounded font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                  {isLoading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>
            </form>
          </>
        )}
        
        {/* Step 3: New Password */}
        {step === 3 && (
          <>
            <h3 className="text-xl font-semibold mb-6 text-center">Set New Password</h3>
            
            {successMessage && (
              <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                {successMessage}
              </div>
            )}
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
            
            <form onSubmit={handlePasswordReset}>
              <div className="mb-4">
                <label htmlFor="newPassword" className="block text-gray-700 font-medium mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter new password"
                  required
                  disabled={isLoading}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Password must be at least 8 characters long
                </p>
              </div>
              
              <div className="mb-4">
                <label htmlFor="confirmPassword" className="block text-gray-700 font-medium mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirm new password"
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div className="flex justify-between mt-6">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="py-2 px-4 border border-gray-300 rounded font-medium text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
                  disabled={isLoading}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="py-2 px-4 rounded font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
