import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  MdNotifications,
  MdInventory,
  MdSell,
  MdBuild,
  MdPerson
} from "react-icons/md";

const NotificationPanel = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);
  const navigate = useNavigate();
  
  // Close notifications panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notificationRef]);
  
  // Icon colors that match your application theme
  const iconColors = {
    products: "#10B981",  // Green
    repair: "#F87171",    // Red for repair
    sales: "#EC4899",     // Pink for sales
    users: "#6366F1",     // Indigo for users
    notification: "#F59E0B" // Amber for notifications
  };
  
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  return (
    <div ref={notificationRef} className="relative">
      <button 
        className="p-1.5 rounded-full hover:bg-gray-100 transition-all"
        aria-label="Notifications"
        title="Notifications"
        onClick={toggleNotifications}
      >
        <MdNotifications size={20} color={iconColors.notification} />
        {/* Notification badge */}
        <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
          3
        </span>
      </button>
      
      {/* Notification panel */}
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50 overflow-hidden border border-gray-200">
          <div className="p-3 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-md font-semibold text-gray-700">Notifications</h3>
              <button className="text-xs text-blue-600 hover:text-blue-800">Mark all as read</button>
            </div>
          </div>
          
          {/* Notification items */}
          <div className="max-h-80 overflow-y-auto">
            {/* Notification item 1 - Unread */}
            <div className="p-3 border-b border-gray-100 bg-blue-50 hover:bg-gray-50 cursor-pointer">
              <div className="flex">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <MdInventory size={20} color={iconColors.products} />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-800">Low stock alert</p>
                  <p className="text-xs text-gray-500 mt-1">Item #A1253 is running low in inventory.</p>
                  <p className="text-xs text-gray-400 mt-1">10 minutes ago</p>
                </div>
              </div>
            </div>
            
            {/* Notification item 2 - Unread */}
            <div className="p-3 border-b border-gray-100 bg-blue-50 hover:bg-gray-50 cursor-pointer">
              <div className="flex">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <MdSell size={20} color={iconColors.sales} />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-800">New sale completed</p>
                  <p className="text-xs text-gray-500 mt-1">Order #2346 has been processed.</p>
                  <p className="text-xs text-gray-400 mt-1">25 minutes ago</p>
                </div>
              </div>
            </div>
            
            {/* Notification item 3 - Unread */}
            <div className="p-3 border-b border-gray-100 bg-blue-50 hover:bg-gray-50 cursor-pointer">
              <div className="flex">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <MdBuild size={20} color={iconColors.repair} />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-800">Repair completed</p>
                  <p className="text-xs text-gray-500 mt-1">Ticket #R5532 has been resolved.</p>
                  <p className="text-xs text-gray-400 mt-1">1 hour ago</p>
                </div>
              </div>
            </div>
            
            {/* Notification item 4 - Read */}
            <div className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
              <div className="flex">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <MdPerson size={20} color={iconColors.users} />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">New user registration</p>
                  <p className="text-xs text-gray-500 mt-1">User John Doe has registered.</p>
                  <p className="text-xs text-gray-400 mt-1">Yesterday</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* View all link */}
          <div className="p-2 border-t border-gray-200 text-center">
            <button 
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              onClick={() => {
                setShowNotifications(false);
                navigate('/admin/notifications');
              }}
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;