require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmailConfig() {
  console.log('Testing email configuration...');
  console.log('Environment variables:');
  console.log('- EMAIL_HOST:', process.env.EMAIL_HOST || 'Not set');
  console.log('- EMAIL_PORT:', process.env.EMAIL_PORT || 'Not set');
  console.log('- EMAIL_SECURE:', process.env.EMAIL_SECURE || 'Not set');
  console.log('- EMAIL_USER:', process.env.EMAIL_USER ? 'Set (not showing)' : 'Not set');
  console.log('- EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set (not showing)' : 'Not set');

  // Create a test transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    debug: true // Enable debug output
  });

  try {
    // Verify connection configuration
    console.log('Verifying connection configuration...');
    await transporter.verify();
    console.log('Server is ready to take our messages');

    // Try to send a test email
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: `"Test Sender" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to yourself for testing
      subject: 'Test Email',
      text: 'This is a test email to verify the configuration.',
      html: '<b>This is a test email to verify the configuration.</b>'
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Success! Email configuration is working correctly.');
  } catch (error) {
    console.error('Error testing email configuration:', error);
    console.log('\nTroubleshooting tips:');
    console.log('1. Check that your .env file exists and has the correct values');
    console.log('2. If using Gmail, make sure you\'re using an App Password, not your regular password');
    console.log('3. Check if your email provider allows less secure apps or requires additional settings');
    console.log('4. Verify there are no network restrictions blocking SMTP connections');
  }
}

testEmailConfig();
