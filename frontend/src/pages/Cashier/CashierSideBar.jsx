// src/components/sidebar/CashierSidebar.jsx

import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  MdDashboard,
  MdPointOfSale,
  MdInventory,
  MdPeople,
  MdReceipt,
  MdLogout,
} from "react-icons/md";
// import { useAuth } from "../../components/AuthContext";

const CashierSidebar = () => {
  // const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Icon color scheme matching your theme
  const iconColors = {
    dashboard: "#4F46E5", // Indigo
    pos: "#10B981",       // Green
    products: "#F59E0B",  // Amber
    customers: "#3B82F6", // Blue
    transactions: "#8B5CF6", // Purple
    logout: "#EF4444",    // Red
  };

  // Navigation items for the cashier role
  const navItems = [
    
    {
      icon: <MdPointOfSale size={22} color={iconColors.pos} />,
      title: "Point of Sale",
      path: "/cashier/shop",
    },
    {
      icon: <MdInventory size={22} color={iconColors.products} />,
      title: "Products",
      path: "/cashier/products",
    },
    {
      icon: <MdPeople size={22} color={iconColors.customers} />,
      title: "Customers",
      path: "/cashier/customers",
    },
    
  ];

  return (
    <div className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col shadow-sm">
      {/* Sidebar header */}
      <div className="p-5 border-b border-gray-200">
        <h1 className="font-bold text-xl text-gray-800">Cashier Panel</h1>
        {/* {user && (
          <div className="text-xs text-gray-500 mt-1">
            {user.email}
            <div className="text-[10px] text-gray-400">Role: {user.role}</div>
          </div>
        )} */}
      </div>

      {/* Navigation items */}
      <nav className="flex-1 py-6 px-4">
        <ul className="space-y-1.5">
          {navItems.map((item, index) => (
            <li key={index}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center p-3 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-gray-100 text-gray-900 font-medium"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`
                }
              >
                <span className="inline-block w-7 mr-3 flex justify-center">
                  {item.icon}
                </span>
                <span>{item.title}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout section */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center w-full p-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-all duration-200"
        >
          <span className="inline-block w-7 mr-3 flex justify-center">
            <MdLogout size={22} color={iconColors.logout} />
          </span>
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
};

export default CashierSidebar;
