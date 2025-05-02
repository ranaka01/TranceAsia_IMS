require('dotenv').config();
const express = require('express');
const db = require('./db');
const UserRoutes = require('./routes/UserRoutes'); 
const SupplierRoutes = require('./routes/SupplierRoutes');
const ProductRoutes = require('./routes/ProductRoutes'); // Import Product routes
const cors = require('cors');

// Initialize app first
const app = express();

// Use middleware
app.use(cors());
app.use(express.json());

// Define your routes
app.use('/users', UserRoutes);
app.use('/suppliers', SupplierRoutes);
app.use('/products', ProductRoutes); // Register the Product routes

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await db.query("SELECT 1");
        console.log('Database connected successfully');

        app.listen(PORT, () => {
            console.log('Server is running on port', PORT);
        });
    } catch (error) {
        console.error('Database connection failed:', error);
        process.exit(1);
    }
}

startServer();