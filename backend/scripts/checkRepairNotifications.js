const db = require('../db');

async function checkRepairNotifications() {
  try {
    console.log('Checking repair notifications in the database...');
    
    // Query to get all repair notifications
    const [rows] = await db.query(`
      SELECT * 
      FROM notifications 
      WHERE type = 'repair' 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log(`Found ${rows.length} repair notifications in the database`);
    
    if (rows.length > 0) {
      console.log('Latest repair notifications:');
      rows.forEach((notification, index) => {
        console.log(`\nNotification #${index + 1}:`);
        console.log(`ID: ${notification.id}`);
        console.log(`User ID: ${notification.user_id}`);
        console.log(`Title: ${notification.title}`);
        console.log(`Message: ${notification.message}`);
        console.log(`Type: ${notification.type}`);
        console.log(`Reference ID: ${notification.reference_id}`);
        console.log(`Reference Type: ${notification.reference_type}`);
        console.log(`Is Read: ${notification.is_read ? 'Yes' : 'No'}`);
        console.log(`Created At: ${notification.created_at}`);
        
        if (notification.data) {
          try {
            const data = JSON.parse(notification.data);
            console.log('Data:', JSON.stringify(data, null, 2));
          } catch (err) {
            console.log('Data: [Error parsing JSON]', notification.data);
          }
        }
      });
    } else {
      console.log('No repair notifications found in the database');
      
      // Check if there are any notifications at all
      const [allRows] = await db.query('SELECT COUNT(*) as count FROM notifications');
      console.log(`Total notifications in database: ${allRows[0].count}`);
    }
    
    return rows;
  } catch (error) {
    console.error('Error checking repair notifications:', error);
    return [];
  }
}

// Run the check
checkRepairNotifications()
  .then(() => {
    console.log('Check completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Check failed:', error);
    process.exit(1);
  });
