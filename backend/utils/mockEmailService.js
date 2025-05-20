/**
 * Mock email service for development and testing
 * This service logs emails to the console instead of sending them
 */

/**
 * Send an OTP email for password reset (mock version)
 * @param {string} to - Recipient email address
 * @param {string} otp - One-time password code
 * @returns {Promise} - Resolves with mock info about the sent email
 */
const sendOTPEmail = async (to, otp) => {
  console.log('\n==================================================');
  console.log('📧 MOCK EMAIL SERVICE - NO ACTUAL EMAIL SENT');
  console.log('==================================================');
  console.log(`📧 To: ${to}`);
  console.log(`📧 Subject: Password Reset OTP`);
  console.log(`📧 OTP Code: ${otp}`);
  console.log('==================================================\n');

  // Return a mock success response
  return {
    messageId: `mock-message-id-${Date.now()}`,
    response: 'Mock email service - no actual email sent'
  };
};

/**
 * Send a repair status update email (mock version)
 * @param {string} to - Recipient email address
 * @param {object} repairData - Data about the repair
 * @returns {Promise} - Resolves with mock info about the sent email
 */
const sendRepairStatusUpdateEmail = async (to, repairData) => {
  console.log('\n==================================================');
  console.log('📧 MOCK EMAIL SERVICE - NO ACTUAL EMAIL SENT');
  console.log('==================================================');
  console.log(`📧 To: ${to}`);
  console.log(`📧 Subject: Update on Your Repair #${repairData.repairId} - Status Changed to ${repairData.newStatus}`);
  console.log(`📧 Content:`);
  console.log(`   - Customer: ${repairData.customerName}`);
  console.log(`   - Device: ${repairData.deviceName} ${repairData.deviceModel}`);
  console.log(`   - Repair Status: ${repairData.newStatus}`);
  console.log('==================================================\n');

  // Return a mock success response
  return {
    messageId: `mock-message-id-${Date.now()}`,
    response: 'Mock email service - no actual email sent'
  };
};

module.exports = {
  sendOTPEmail,
  sendRepairStatusUpdateEmail
};
