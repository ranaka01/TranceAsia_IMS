const nodemailer = require('nodemailer');
require('dotenv').config();

// Create a transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true' || false,
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || ''
  }
});

/**
 * Send an OTP email for password reset
 * @param {string} to - Recipient email address
 * @param {string} otp - One-time password code
 * @returns {Promise} - Resolves with info about the sent email
 */
const sendOTPEmail = async (to, otp) => {
  try {
    // Email content
    const mailOptions = {
      from: `"Trance Asia Computers" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: 'Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #3b82f6;">Trance Asia Computers</h2>
            <h3 style="color: #4b5563;">Password Reset Request</h3>
          </div>
          
          <p style="margin-bottom: 15px;">Hello,</p>
          
          <p style="margin-bottom: 15px;">We received a request to reset your password. Please use the following One-Time Password (OTP) to complete the process:</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; text-align: center; margin: 20px 0; border-radius: 5px;">
            <h2 style="margin: 0; letter-spacing: 5px; color: #1f2937;">${otp}</h2>
          </div>
          
          <p style="margin-bottom: 15px;">This OTP is valid for 15 minutes. If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
          
          <p style="margin-bottom: 5px;">Thank you,</p>
          <p style="margin-top: 0;">Trance Asia Computers Team</p>
          
          <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #6b7280; text-align: center;">
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      `
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
};

module.exports = {
  sendOTPEmail
};
