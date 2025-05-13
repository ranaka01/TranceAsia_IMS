import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { 
  MdDashboard, 
  MdInventory,
  MdLocalShipping, 
  MdPeople,
  MdShoppingCart, 
  MdBuild,
  MdLogout,
  MdSell,
  MdPerson,
  MdWarehouse,
  MdSecurity,
  MdMenu,
  MdChevronLeft
} from "react-icons/md";
// Import the logo with correct path
import tacLogo from "../../assets/tac-logo.png";
// Import the notification component
import NotificationPanel from "./NotificationPanel";

const Sidebar = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Icon colors that match your application theme
  const iconColors = {
    dashboard: "#4F46E5", // Indigo
    products: "#10B981",  // Green
    suppliers: "#F59E0B", // Amber
    customers: "#3B82F6", // Blue
    orders: "#8B5CF6",    // Purple
    repair: "#F87171",    // Red for repair
    sales: "#EC4899",     // Pink for sales
    users: "#6366F1",     // Indigo for users
    inventory: "#059669", // Emerald for inventory
    warranty: "#0EA5E9",  // Sky blue for warranty
    logout: "#EF4444",    // Red
    toggle: "#4F46E5"     // Indigo for toggle
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
      title: "Purchases", 
      path: "/admin/purchases" 
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
      icon: <MdBuild size={22} color={iconColors.repair} />,
      title: "Repairs", 
      path: "/admin/repairs" 
    },
    { 
      icon: <MdPerson size={22} color={iconColors.users} />,
      title: "Users", 
      path: "/admin/users" 
    },
    { 
      icon: <MdSell size={22} color={iconColors.sales} />,
      title: "Sales", 
      path: "/admin/sales" 
    },
    { 
      icon: <MdWarehouse size={22} color={iconColors.inventory} />,
      title: "Inventory", 
      path: "/admin/inventory" 
    },
    { 
      icon: <MdSecurity size={22} color={iconColors.warranty} />,
      title: "Warranty", 
      path: "/admin/warranty" 
    },
  ];

  return (
    <div 
      className={`${isCollapsed ? 'w-16' : 'w-64'} h-screen bg-white border-r border-gray-200 flex flex-col shadow-sm overflow-hidden transition-all duration-300`}
    >
      {/* Top bar with logo and action buttons */}
      <div className={`${isCollapsed ? 'p-2' : 'p-4'} border-b border-gray-200 flex-shrink-0 transition-all duration-300`}>
        {/* Logo and title section */}
        <div className="flex flex-col items-center">
          {!isCollapsed && <h1 className="font-bold text-xl text-gray-800">Trance Asia</h1>}
          <img 
            src={tacLogo} 
            alt="TAC Logo" 
            className={`${isCollapsed ? 'h-8 mt-1' : 'h-12 mt-2'} w-auto object-contain transition-all duration-300`} 
          />
        </div>

        {/* Action buttons - fixed at the top */}
        <div className="absolute top-4 right-3 flex space-x-2">
          {/* Notification component */}
          <NotificationPanel />
          
          {/* Toggle sidebar button */}
          <button 
            onClick={toggleSidebar}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-all"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? 
              <MdMenu size={20} color={iconColors.toggle} /> : 
              <MdChevronLeft size={20} color={iconColors.toggle} />
            }
          </button>
        </div>
      </div>

      {/* Navigation items - Scrollable middle section */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        <ul className="space-y-1">
          {navItems.map((item, index) => (
            <li key={index}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center ${isCollapsed ? 'justify-center p-2' : 'p-2'} rounded-lg transition-all duration-200 ${
                    isActive 
                      ? "bg-gray-100 text-gray-900 font-medium" 
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`
                }
                title={item.title}
              >
                <span className={`inline-block ${isCollapsed ? '' : 'w-7 mr-2'} flex justify-center`}>
                  {item.icon}
                </span>
                {!isCollapsed && <span>{item.title}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User info and logout - Fixed at bottom */}
      <div className={`${isCollapsed ? 'p-2' : 'p-3'} border-t border-gray-200 flex-shrink-0 transition-all duration-300`}>
        {!isCollapsed && (
          <div className="flex items-center mb-2 px-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold mr-3">
              TA
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Admin User</p>
              <p className="text-xs text-gray-500">admin@tranceasia.com</p>
            </div>
          </div>
        )}
        
        {/* Bottom action buttons */}
        <div className={`flex justify-center`}>
          {/* Logout button */}
          <button
            onClick={handleLogout}
            className={`flex items-center ${isCollapsed ? 'justify-center p-2' : 'w-full p-2'} text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-all duration-200`}
            title="Log Out"
          >
            <span className="flex justify-center">
              <MdLogout size={22} color={iconColors.logout} />
            </span>
            {!isCollapsed && <span className="ml-2">Log Out</span>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;