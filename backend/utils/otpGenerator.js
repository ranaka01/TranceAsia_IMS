/**
 * Utility functions for generating and validating OTP codes
 */

/**
 * Generate a random numeric OTP code of specified length
 * @param {number} length - Length of the OTP code (default: 6)
 * @returns {string} - Generated OTP code
 */
const generateOTP = (length = 6) => {
  // Generate a random number with the specified number of digits
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  const otp = Math.floor(min + Math.random() * (max - min + 1))
    .toString()
    .padStart(length, '0');
  
  return otp;
};

/**
 * Check if an OTP has expired
 * @param {Date} createdAt - When the OTP was created
 * @param {number} expiryMinutes - Expiry time in minutes (default: 15)
 * @returns {boolean} - True if expired, false otherwise
 */
const isOTPExpired = (createdAt, expiryMinutes = 15) => {
  const expiryTime = new Date(createdAt.getTime() + expiryMinutes * 60000);
  return new Date() > expiryTime;
};

module.exports = {
  generateOTP,
  isOTPExpired
};
