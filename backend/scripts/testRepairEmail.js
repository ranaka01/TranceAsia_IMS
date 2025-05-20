require('dotenv').config();
const { sendRepairStatusUpdateEmail } = require('../utils/emailService');

async function testRepairStatusEmail() {
  console.log('Testing repair status update email...');
  console.log('Environment variables:');
  console.log('- EMAIL_HOST:', process.env.EMAIL_HOST || 'Not set');
  console.log('- EMAIL_PORT:', process.env.EMAIL_PORT || 'Not set');
  console.log('- EMAIL_SECURE:', process.env.EMAIL_SECURE || 'Not set');
  console.log('- EMAIL_USER:', process.env.EMAIL_USER ? 'Set (not showing)' : 'Not set');
  console.log('- EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set (not showing)' : 'Not set');

  // Sample repair data
  const repairData = {
    repairId: '12345',
    customerName: 'John Doe',
    deviceName: 'Laptop',
    deviceModel: 'Dell XPS 15',
    newStatus: 'Completed'
  };

  try {
    // Test email address - replace with your test email
    const testEmail = process.env.EMAIL_USER || 'test@example.com';

    console.log(`Sending test email to: ${testEmail}`);
    const result = await sendRepairStatusUpdateEmail(testEmail, repairData);

    console.log('Email sent successfully!');
    console.log('Message ID:', result.messageId);
    console.log('Success! Email configuration is working correctly.');
  } catch (error) {
    console.error('Error sending test email:', error);
    console.log('\nTroubleshooting tips:');
    console.log('1. Check that your .env file exists and has the correct values');
    console.log('2. If using Gmail, make sure you\'re using an App Password, not your regular password');
    console.log('3. Check if your email provider allows less secure apps or requires additional settings');
    console.log('4. Verify there are no network restrictions blocking SMTP connections');
  }
}

testRepairStatusEmail();
