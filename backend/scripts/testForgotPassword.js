require('dotenv').config();
const { sendOTPEmail } = require('../utils/emailService');

async function testForgotPassword() {
  try {
    console.log('Testing forgot password email...');
    
    // Test email address
    const testEmail = 'fernand-im21043@stu.kln.ac.lk';
    
    // Generate a test OTP
    const testOTP = '123456';
    
    console.log(`Sending test OTP email to ${testEmail}...`);
    
    // Send the email
    const result = await sendOTPEmail(testEmail, testOTP);
    
    console.log('Email sent successfully!');
    console.log('Message ID:', result.messageId);
  } catch (error) {
    console.error('Error sending test email:', error);
  }
}

testForgotPassword();
