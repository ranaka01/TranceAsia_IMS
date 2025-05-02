const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'TranceAsiaComputers',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Promisify pool queries
const promisePool = pool.promise();

// Debug: Test DB connection
promisePool.query('SELECT 1')
    .then(() => {
        console.log('✅ Database connection successful.');
    })
    .catch((err) => {
        console.error('❌ Database connection failed:', err.message);
        // Optionally, exit the process if DB is critical
        // process.exit(1);
    });

module.exports = promisePool;
