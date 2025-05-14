import React, { useState, useEffect } from "react";
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
  MdChevronLeft,
  MdChevronRight,
  MdNotifications,
  MdBarChart,
  MdAssignmentReturn
} from "react-icons/md";
import tacLogo from "../../assets/tac-logo.png";
import API from "../../utils/api";
import { jwtDecode } from "jwt-decode";
import UserSettings from "./UserSettings";

const Sidebar = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [userData, setUserData] = useState({
    id: null,
    username: "",
    email: "",
    role: "",
  });
  const [showSettings, setShowSettings] = useState(false);

  // Fetch user data from token
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserData({
          id: decoded.userId,
          username: decoded.username || "",
          email: decoded.email || "",
          role: decoded.role || "",
        });
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }
  }, []);

  // Fetch profile image if user ID exists
  useEffect(() => {
    if (userData.id) {
      const fetchProfileImage = async () => {
        try {
          const response = await API.get(`/users/${userData.id}`);
          if (response.data?.data?.user?.profile_image) {
            const imageUrl = `http://localhost:5000/uploads/${response.data.data.user.profile_image}`;
            setProfileImage(imageUrl);
          }
        } catch (error) {
          console.error("Error fetching profile image:", error);
        }
      };

      fetchProfileImage();
    }
  }, [userData.id]);

  const handleLogout = () => {
    // Show confirmation dialog
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("token");
      navigate("/login");
    }
  };

  const toggleSidebar = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    // Notify parent component if prop exists
    if (onToggleSidebar) {
      onToggleSidebar(newCollapsedState);
    }
  };

  // Icon colors that match your application theme
  const iconColors = {
    dashboard: "#4F46E5", // Indigo
    products: "#10B981", // Green
    suppliers: "#F59E0B", // Amber
    customers: "#3B82F6", // Blue
    orders: "#8B5CF6", // Purple
    repair: "#F87171", // Red for repair
    sales: "#EC4899", // Pink for sales
    users: "#6366F1", // Indigo for users
    inventory: "#059669", // Emerald for inventory
    warranty: "#0EA5E9", // Sky blue for warranty
    logout: "#EF4444", // Red
    toggle: "#4F46E5", // Indigo for toggle
    notifications: "#EC4899", // Pink
    reports: "#8B5CF6", // Purple
    returns: "#F59E0B", // Amber
  };

  const navItems = [
    {
      icon: <MdDashboard size={20} color={iconColors.dashboard} />,
      title: "Dashboard",
      path: "/admin/dashboard",
    },
    {
      icon: <MdInventory size={20} color={iconColors.products} />,
      title: "Products",
      path: "/admin/products",
    },
    {
      icon: <MdShoppingCart size={20} color={iconColors.orders} />,
      title: "Purchases",
      path: "/admin/purchases",
    },
    {
      icon: <MdLocalShipping size={20} color={iconColors.suppliers} />,
      title: "Suppliers",
      path: "/admin/suppliers",
    },
    {
      icon: <MdPeople size={20} color={iconColors.customers} />,
      title: "Customers",
      path: "/admin/customers",
    },
    {
      icon: <MdBuild size={20} color={iconColors.repair} />,
      title: "Repairs",
      path: "/admin/repairs",
    },
    {
      icon: <MdPerson size={20} color={iconColors.users} />,
      title: "Users",
      path: "/admin/users",
    },
    {
      icon: <MdSell size={20} color={iconColors.sales} />,
      title: "Sales",
      path: "/admin/sales",
    },
    {
      icon: <MdWarehouse size={20} color={iconColors.inventory} />,
      title: "Inventory",
      path: "/admin/inventory",
    },
    {
      icon: <MdSecurity size={20} color={iconColors.warranty} />,
      title: "Warranty",
      path: "/admin/warranty",
    },
    {
      icon: <MdNotifications size={20} color={iconColors.notifications} />,
      title: "Notifications",
      path: "/admin/notifications",
    },
    {
      icon: <MdBarChart size={20} color={iconColors.reports} />,
      title: "Reports",
      path: "/admin/reports",
    },
    {
      icon: <MdAssignmentReturn size={20} color={iconColors.returns} />,
      title: "Return",
      path: "/admin/return",
    },
  ];

  return (
    <div
      className={`fixed left-0 top-0 h-screen ${
        isCollapsed ? "w-16" : "w-64"
      } bg-white border-r border-gray-200 flex flex-col shadow-lg transition-all duration-300 z-10 overflow-hidden`}
    >
      {/* Top section with title/logo */}
      <div className="py-4 px-4 border-b border-gray-200 flex-shrink-0 flex items-center justify-center bg-gradient-to-r from-indigo-50 to-white">
        {isCollapsed ? (
          <div className="flex justify-center items-center">
            <img
              src={tacLogo}
              alt="TAC Logo"
              className="h-8 w-auto object-contain"
            />
          </div>
        ) : (
          <h1 className="font-bold text-lg text-indigo-700">
            Trance Asia Computers
          </h1>
        )}
      </div>

      {/* Navigation items - Scrollable middle section */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2 relative">
        {/* Toggle sidebar button - positioned half in/half out of the sidebar with rounded shape */}
        <div
          className="absolute top-1/2 transform -translate-y-1/2 z-20"
          style={{ right: "-12px" }}
        >
          <button
            onClick={toggleSidebar}
            className="flex items-center justify-center w-7 h-7 bg-white rounded-full border border-gray-200 shadow-md hover:bg-gray-50 focus:outline-none transition-colors"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <div
              className="flex items-center justify-center"
              style={{ marginLeft: "-8px" }}
            >
              {isCollapsed ? (
                <MdChevronRight size={16} color={iconColors.toggle} />
              ) : (
                <MdChevronLeft size={16} color={iconColors.toggle} />
              )}
            </div>
          </button>
        </div>

        <ul className="space-y-0.5">
          {navItems.map((item, index) => (
            <li key={index}>
              <NavLink
                to={item.path}
                className={({ isActive }) => {
                  // Base classes for both states
                  let classes =
                    "flex items-center rounded-lg transition-all duration-200 h-9 ";

                  // Add active/inactive styles
                  classes += isActive
                    ? "bg-indigo-100 text-indigo-700 font-medium shadow-sm "
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 ";

                  // Add layout styles based on collapsed state
                  if (isCollapsed) {
                    classes += "justify-center px-0 mx-auto";
                  } else {
                    classes += "px-3";
                  }

                  return classes;
                }}
                title={item.title}
              >
                {/* Icon - centered when collapsed */}
                <span className="flex justify-center items-center">
                  {item.icon}
                </span>

                {/* Text appears only when not collapsed */}
                {!isCollapsed && (
                  <span className="text-sm whitespace-nowrap ml-2.5">
                    {item.title}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User profile and logout at bottom */}
      <div
        className={`border-t border-gray-200 p-3 flex ${
          isCollapsed ? "flex-col items-center" : "items-center justify-between"
        } bg-gray-50`}
      >
        {/* User profile section - opens user settings modal */}
        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center hover:opacity-80 transition-opacity"
          title="User Settings"
        >
          {profileImage ? (
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-indigo-200 shadow-sm">
              <img
                src={profileImage}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-sm">
              {userData.username
                ? userData.username.substring(0, 2).toUpperCase()
                : "U"}
            </div>
          )}

          {!isCollapsed && (
            <div className="ml-2 truncate text-left">
              <p className="text-sm font-medium text-gray-800 truncate">
                {userData.username || "User"}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {userData.role || "Role"}
              </p>
            </div>
          )}
        </button>

        {/* Logout button */}
        {!isCollapsed ? (
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-full hover:bg-red-50 hover:text-red-500 transition-all"
            aria-label="Log Out"
            title="Log Out"
          >
            <MdLogout size={20} color={iconColors.logout} />
          </button>
        ) : (
          <button
            onClick={handleLogout}
            className="p-1.5 mt-2 rounded-full hover:bg-red-50 hover:text-red-500 transition-all"
            aria-label="Log Out"
            title="Log Out"
          >
            <MdLogout size={20} color={iconColors.logout} />
          </button>
        )}
      </div>

      {/* User Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen">
            <div className="fixed inset-0 bg-black opacity-50"></div>
            <div className="relative bg-white w-full max-w-4xl rounded-lg shadow-lg overflow-hidden">
              <UserSettings onClose={() => setShowSettings(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;