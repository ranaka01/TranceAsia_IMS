require('dotenv').config();
const express = require('express');
const path = require('path'); // Add this for path handling
const db = require('./db');
const UserRoutes = require('./routes/UserRoutes'); 
const SupplierRoutes = require('./routes/SupplierRoutes');
const ProductRoutes = require('./routes/ProductRoutes'); 
const CustomerRoutes = require('./routes/CustomerRoutes');
const PurchaseRoutes = require('./routes/PurchaseRoutes');
const SalesRoutes = require('./routes/SalesRoutes');
const cors = require('cors');
const fs = require('fs'); // Add this for file system operations

// Initialize app first
const app = express();

// Use middleware
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory');
}

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Define your routes
app.use('/users', UserRoutes);
app.use('/suppliers', SupplierRoutes);
app.use('/products', ProductRoutes);
app.use('/customers', CustomerRoutes);  
app.use('/purchases', PurchaseRoutes);
app.use('/sales', SalesRoutes);
//app.use('/products', require('./routes/productRoute'));


const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await db.query("SELECT 1");
        console.log('Database connected successfully');

        app.listen(PORT, () => {
            console.log('Server is running on port', PORT);
            console.log(`Profile images available at: http://localhost:${PORT}/uploads/`);
        });
    } catch (error) {
        console.error('Database connection failed:', error);
        process.exit(1);
    }
}

startServer();