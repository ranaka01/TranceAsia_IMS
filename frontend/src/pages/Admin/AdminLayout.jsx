import React, { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Sidebar from "./Sidebar";

const AdminLayout = () => {
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  
  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    
    try {
      // Verify token is valid
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      
      if (decoded.exp < currentTime) {
        // Token expired
        localStorage.removeItem('token');
        navigate('/login');
      }
    } catch (error) {
      console.error('Invalid token:', error);
      localStorage.removeItem('token');
      navigate('/login');
    }
  }, [navigate]);
  
  const toggleMobileSidebar = () => {
    setShowMobileSidebar(!showMobileSidebar);
  };
  
  const handleToggleSidebar = (collapsed) => {
    setIsCollapsed(collapsed);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar onToggleSidebar={handleToggleSidebar} />
      </div>
      
      {/* Mobile Sidebar Overlay */}
      {showMobileSidebar && (
        <div className="lg:hidden fixed inset-0 z-40">
          {/* Dark overlay */}
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"
            onClick={toggleMobileSidebar}
          ></div>
          
          {/* Sidebar */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white z-50">
            <Sidebar onToggleSidebar={handleToggleSidebar} />
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <div className={`flex-1 flex flex-col overflow-hidden ${isCollapsed ? 'lg:ml-16' : 'lg:ml-64'} transition-all duration-300`}>
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;