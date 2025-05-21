import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

// Admin components
import AdminLayout from "./pages/Admin/AdminLayout";
import Dashboard from "./pages/Admin/Dashboard";
import Products from "./pages/Admin/Products";
import Suppliers from "./pages/Admin/Suppliers";
import Customers from "./pages/Admin/Customers";
import Orders from "./pages/Admin/Orders";
import Purchases from "./pages/Admin/Purchases";
import Repairs from "./pages/Admin/Repairs";
import Users from "./pages/Admin/Users"
import Sales from "./pages/Admin/Sales"
import Inventory from "./pages/Admin/Inventory"
import Warranty from "./pages/Admin/Warranty"
import Notifications from "./pages/Admin/notifications"
import Reports from "./pages/Admin/Reports";
import Return from "./pages/Admin/Return";
import UndoLogs from "./pages/Admin/UndoLogs";
import SystemSettings from "./pages/Admin/SystemSettings";


// Auth components
import Login from "./pages/Login";
import Register from "./pages/Register";
import AccessDenied from "./pages/AccessDenied";

// Cashier components
import CashierLayout from "./pages/Cashier/CashierLayout";
import CashierCustomers from "./pages/Cashier/CashierCustomers";
import CashierProducts from "./pages/Cashier/CashierProducts";
import CashierShop from "./pages/Cashier/CashierShop";
import CashierTransactions from "./pages/Cashier/CashierTransactions";
import CashierReports from "./pages/Cashier/CashierReports";
import CashierWarranty from "./pages/Cashier/CashierWarranty";


// Technician components

import TechnicianLayout from "./pages/Technician/TechnicianLayout";
import TechnicianDashboard from "./pages/Technician/TechnicianDashboard";
//import TechnicianRepairs from "./pages/Technician/TechnicianRepairs";
//import TechnicianWarrantyCheck from "./pages/Technician/TechnicianWarrantyCheck";

// PrivateRoute Component for role-based access control
const PrivateRoute = ({ roles, children }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    console.log("🚨 No token found. Redirecting to login.");
    return <Navigate to="/login" />;
  }

  let role;
  try {
    const decodedToken = jwtDecode(token);
    role = decodedToken.role;
    console.log("✅ Decoded Role:", role);
    console.log("Decoded Token:", decodedToken);
  } catch (e) {
    console.log("🚨 Invalid token. Redirecting to login.");
    localStorage.removeItem("token"); // Clear invalid token
    return <Navigate to="/login" />;
  }

  console.log(`🔍 Checking if '${role}' exists in`, roles);

  if (!roles.includes(role)) {
    console.log(`🚫 Access Denied: '${role}' does not match any of`, roles);
    return <Navigate to="/access-denied" />;
  }

  console.log(`✅ Access Granted for: '${role}'`);
  return children;
};

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Default routes */}
        <Route path="/" element={<Navigate to="/admin" />} />
        <Route path="*" element={<Navigate to="/login" />} />

        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/access-denied" element={<AccessDenied />} />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <PrivateRoute roles={['Admin']}>
              <AdminLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="suppliers" element={<Suppliers />} />
          <Route path="customers" element={<Customers />} />
          <Route path="orders" element={<Orders />} />
          <Route path="repairs" element={<Repairs />} />
          <Route path="users" element={<Users />} />
          <Route path="purchases" element={<Purchases />} />
          <Route path="sales" element={<Sales />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="warranty" element={<Warranty />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="reports" element={<Reports/>} />
          <Route path="return" element={<Return/>} />
          <Route path="undo-logs" element={<UndoLogs/>} />
          <Route path="settings" element={<SystemSettings/>} />
        </Route>

        {/* Cashier routes */}
        <Route
          path="/cashier"
          element={
            <PrivateRoute roles={['Cashier']}>
              <CashierLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/cashier/transactions" replace />} />
          <Route path="customers" element={<CashierCustomers />} />
          <Route path="products" element={<CashierProducts />} />
          <Route path="shop" element={<CashierShop />} />
          <Route path="transactions" element={<CashierTransactions />} />
          <Route path="reports" element={<CashierReports />} />
          <Route path="warranty" element={<CashierWarranty />} />
        </Route>

        {/* Technician routes - Uncomment when ready */}
        <Route
          path="/technician"
          element={
            <PrivateRoute roles={['Technician']}>
              <TechnicianLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<TechnicianDashboard />} />
          <Route path="dashboard" element={<TechnicianDashboard />} />
          {/* <Route path="repairs" element={<TechnicianRepairs />} /> */}
          {/* <Route path="warranty-check" element={<TechnicianWarrantyCheck />} /> */}
        </Route>

      </Routes>
    </Router>
  );
};

export default App;