const initRepairTables = require('../utils/initRepairTables');

// Run the initialization
initRepairTables()
  .then(() => {
    console.log('Repair database tables initialized successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed to initialize repair database tables:', error);
    process.exit(1);
  });
