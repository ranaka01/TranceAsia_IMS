import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { 
  MdDashboard, 
  MdInventory,
  MdLocalShipping, 
  MdPeople,
  MdShoppingCart, 
  MdBuild,  // Used for repair icon
  MdLogout 
} from "react-icons/md";

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Icon colors that match your application theme
  const iconColors = {
    dashboard: "#4F46E5", // Indigo
    products: "#10B981",  // Green
    suppliers: "#F59E0B", // Amber
    customers: "#3B82F6", // Blue
    orders: "#8B5CF6",    // Purple
    repair: "#F87171",    // Red for repair
    logout: "#EF4444"     // Red
  };

  const navItems = [
    { 
      icon: <MdDashboard size={22} color={iconColors.dashboard} />, 
      title: "Dashboard", 
      path: "/admin/dashboard" 
    },
    { 
      icon: <MdInventory size={22} color={iconColors.products} />, 
      title: "Products", 
      path: "/admin/products" 
    },
    { 
      icon: <MdShoppingCart size={22} color={iconColors.orders} />, 
      title: "Orders", 
      path: "/admin/orders" 
    },
    { 
      icon: <MdLocalShipping size={22} color={iconColors.suppliers} />, 
      title: "Suppliers", 
      path: "/admin/suppliers" 
    },
    { 
      icon: <MdPeople size={22} color={iconColors.customers} />, 
      title: "Customers", 
      path: "/admin/customers" 
    },
    { 
      icon: <MdBuild size={22} color={iconColors.repair} />, // Changed to MdBuild for repairs
      title: "Repairs", 
      path: "/admin/repairs" 
    },
  ];

  return (
    <div className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col shadow-sm">
      {/* Company logo/name */}
      <div className="p-5 border-b border-gray-200">
        <h1 className="font-bold text-xl text-gray-800">Trance Asia Computers</h1>
        <p className="text-xs text-gray-500 mt-1">Inventory Management System</p>
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
                <span>
                  {item.title}
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User info and logout */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold mr-3">
            TA
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Admin User</p>
            <p className="text-xs text-gray-500">admin@tranceasia.com</p>
          </div>
        </div>
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

export default Sidebar;
