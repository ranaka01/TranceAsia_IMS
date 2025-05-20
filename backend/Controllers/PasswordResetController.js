const db = require('../db');
const bcrypt = require('bcryptjs');
const User = require('../Models/UserModel');
const { generateOTP, isOTPExpired } = require('../utils/otpGenerator');

// Choose the appropriate email service based on environment
const emailService = process.env.NODE_ENV === 'development'
  ? require('../utils/mockEmailService')  // Use mock service in development
  : require('../utils/emailService');     // Use real service in production

const { sendOTPEmail } = emailService;

/**
 * Handle forgot password request
 * Verify email exists, generate OTP, and send email
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 'fail',
        message: 'Email is required'
      });
    }

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'No user found with that email address'
      });
    }

    // Check if user is active
    if (user.is_active === 0) {
      return res.status(401).json({
        status: 'fail',
        message: 'User account has been deactivated'
      });
    }

    // Generate a 6-digit OTP
    const otp = generateOTP(6);
    console.log('Generated OTP for testing:', otp); // For debugging only

    // Delete any existing OTP for this user
    await db.query('DELETE FROM password_reset_tokens WHERE user_id = ?', [user.User_ID]);

    // Store the OTP in the database
    await db.query(
      'INSERT INTO password_reset_tokens (user_id, email, token) VALUES (?, ?, ?)',
      [user.User_ID, email, otp]
    );

    try {
      // Send OTP email
      await sendOTPEmail(email, otp);

      res.status(200).json({
        status: 'success',
        message: 'OTP sent to your email address'
      });
    } catch (emailError) {
      console.error('Failed to send email:', emailError);

      // For development/testing purposes only
      if (process.env.NODE_ENV === 'development') {
        return res.status(200).json({
          status: 'success',
          message: 'OTP generated successfully but email sending failed. Using test mode.',
          testOtp: otp // Only include in development mode
        });
      }

      // In production, still return a user-friendly message
      return res.status(500).json({
        status: 'error',
        message: 'Failed to send OTP email. Please try again later or contact support.'
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process your request. Please try again later.'
    });
  }
};

/**
 * Verify OTP code
 */
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        status: 'fail',
        message: 'Email and OTP are required'
      });
    }

    // Find the token record
    const [tokens] = await db.query(
      'SELECT * FROM password_reset_tokens WHERE email = ? ORDER BY created_at DESC LIMIT 1',
      [email]
    );

    if (tokens.length === 0) {
      return res.status(404).json({
        status: 'fail',
        message: 'No OTP found for this email address'
      });
    }

    const tokenRecord = tokens[0];

    // Check if token is already used
    if (tokenRecord.is_used === 1) {
      return res.status(400).json({
        status: 'fail',
        message: 'This OTP has already been used'
      });
    }

    // Check if token has expired (15 minutes)
    if (isOTPExpired(new Date(tokenRecord.created_at))) {
      return res.status(400).json({
        status: 'fail',
        message: 'OTP has expired. Please request a new one.'
      });
    }

    // Check if max attempts exceeded
    if (tokenRecord.attempts >= 3) {
      return res.status(400).json({
        status: 'fail',
        message: 'Too many failed attempts. Please request a new OTP.'
      });
    }

    // Verify the OTP
    if (tokenRecord.token !== otp) {
      // Increment attempts
      await db.query(
        'UPDATE password_reset_tokens SET attempts = attempts + 1 WHERE id = ?',
        [tokenRecord.id]
      );

      return res.status(400).json({
        status: 'fail',
        message: 'Invalid OTP'
      });
    }

    // OTP is valid - don't mark as used yet, will do that after password reset
    res.status(200).json({
      status: 'success',
      message: 'OTP verified successfully'
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to verify OTP. Please try again later.'
    });
  }
};

/**
 * Reset password after OTP verification
 */
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        status: 'fail',
        message: 'Email, OTP, and new password are required'
      });
    }

    // Validate password complexity
    if (newPassword.length < 8) {
      return res.status(400).json({
        status: 'fail',
        message: 'Password must be at least 8 characters long'
      });
    }

    // Find the token record
    const [tokens] = await db.query(
      'SELECT * FROM password_reset_tokens WHERE email = ? AND token = ? ORDER BY created_at DESC LIMIT 1',
      [email, otp]
    );

    if (tokens.length === 0) {
      return res.status(404).json({
        status: 'fail',
        message: 'Invalid or expired OTP'
      });
    }

    const tokenRecord = tokens[0];

    // Check if token is already used
    if (tokenRecord.is_used === 1) {
      return res.status(400).json({
        status: 'fail',
        message: 'This OTP has already been used'
      });
    }

    // Check if token has expired (15 minutes)
    if (isOTPExpired(new Date(tokenRecord.created_at))) {
      return res.status(400).json({
        status: 'fail',
        message: 'OTP has expired. Please request a new one.'
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    await db.query('UPDATE User SET Password = ? WHERE User_ID = ?', [hashedPassword, tokenRecord.user_id]);

    // Mark the token as used
    await db.query('UPDATE password_reset_tokens SET is_used = 1 WHERE id = ?', [tokenRecord.id]);

    res.status(200).json({
      status: 'success',
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to reset password. Please try again later.'
    });
  }
};

module.exports = {
  forgotPassword,
  verifyOTP,
  resetPassword
};
