const nodemailer = require('nodemailer');
require('dotenv').config();

// Debug: Log email configuration (without sensitive info)
console.log('Email Configuration:');
console.log('- HOST:', process.env.EMAIL_HOST || 'Default: smtp.gmail.com');
console.log('- PORT:', process.env.EMAIL_PORT || 'Default: 465');
console.log('- SECURE:', process.env.EMAIL_SECURE || 'Default: true');
console.log('- USER:', process.env.EMAIL_USER ? 'Set (not showing for security)' : 'NOT SET');
console.log('- PASS:', process.env.EMAIL_PASS ? 'Set (not showing for security)' : 'NOT SET');

// Create a transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '465'),
  secure: process.env.EMAIL_SECURE === 'true' || true, // Use SSL
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || ''
  },
  debug: true, // Enable debug output
  tls: {
    // Do not fail on invalid certificates
    rejectUnauthorized: false
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
    console.log(`Attempting to send OTP email to ${to}...`);

    // First verify the transporter configuration
    try {
      console.log('Verifying email transporter configuration...');
      await transporter.verify();
      console.log('Email transporter configuration verified successfully');
    } catch (verifyError) {
      console.error('Email transporter verification failed:', verifyError);
      throw new Error(`Email configuration error: ${verifyError.message}`);
    }

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
    console.log('Sending email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending OTP email:', error);

    // Provide more detailed error information
    if (error.code === 'EAUTH') {
      throw new Error('Authentication failed. Please check your email username and password.');
    } else if (error.code === 'ESOCKET' || error.code === 'ETIMEDOUT') {
      throw new Error('Connection to email server failed. Please check your network connection and email server settings.');
    } else {
      throw new Error(`Failed to send OTP email: ${error.message}`);
    }
  }
};

/**
 * Send a repair status update email to the customer
 * @param {string} to - Recipient email address
 * @param {object} repairData - Data about the repair
 * @param {string} repairData.repairId - The repair ID
 * @param {string} repairData.customerName - The customer's name
 * @param {string} repairData.deviceName - The device name
 * @param {string} repairData.deviceModel - The device model
 * @param {string} repairData.newStatus - The new repair status
 * @returns {Promise} - Resolves with info about the sent email
 */
const sendRepairStatusUpdateEmail = async (to, repairData) => {
  try {
    console.log(`Attempting to send repair status update email to ${to}...`);

    // First verify the transporter configuration
    try {
      console.log('Verifying email transporter configuration...');
      await transporter.verify();
      console.log('Email transporter configuration verified successfully');
    } catch (verifyError) {
      console.error('Email transporter verification failed:', verifyError);
      throw new Error(`Email configuration error: ${verifyError.message}`);
    }

    // Email content
    const mailOptions = {
      from: `"Trance Asia Computers" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: `Update on Your Repair #${repairData.repairId} - Status Changed to ${repairData.newStatus}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #3b82f6;">Trance Asia Computers</h2>
            <h3 style="color: #4b5563;">Repair Status Update</h3>
          </div>

          <p style="margin-bottom: 15px;">Hello ${repairData.customerName},</p>

          <p style="margin-bottom: 15px;">We're writing to inform you that the status of your repair has been updated.</p>

          <div style="background-color: #f3f4f6; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <h3 style="margin-top: 0; color: #1f2937;">Repair Details:</h3>
            <p><strong>Repair ID:</strong> ${repairData.repairId}</p>
            <p><strong>Device:</strong> ${repairData.deviceName} ${repairData.deviceModel}</p>
            <p><strong>Repair Status:</strong> <span style="color: #3b82f6; font-weight: bold;">${repairData.newStatus}</span></p>
          </div>

          <p style="margin-bottom: 15px;">If you have any questions about your repair, please contact us at ${'tranceasiacomputers@gmail.com'} or call us at +94 77 009 3285.</p>

          <p style="margin-bottom: 5px;">Thank you for choosing our services,</p>
          <p style="margin-top: 0;">Trance Asia Computers Team</p>

          <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #6b7280; text-align: center;">
            <p>Trance Asia Computers | 123, Main Street, Ambalantota, Sri Lanka | +94 77 009 3285</p>
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      `
    };

    // Send the email
    console.log('Sending repair status update email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('Repair status update email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending repair status update email:', error);

    // Provide more detailed error information
    if (error.code === 'EAUTH') {
      throw new Error('Authentication failed. Please check your email username and password.');
    } else if (error.code === 'ESOCKET' || error.code === 'ETIMEDOUT') {
      throw new Error('Connection to email server failed. Please check your network connection and email server settings.');
    } else {
      throw new Error(`Failed to send repair status update email: ${error.message}`);
    }
  }
};

module.exports = {
  sendOTPEmail,
  sendRepairStatusUpdateEmail
};
