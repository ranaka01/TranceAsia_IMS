import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import CashierSidebar from "./CashierSideBar";
import { MdMenu } from "react-icons/md";

const CashierLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const handleToggleSidebar = (collapsed) => {
    setIsCollapsed(collapsed);
  };

  const toggleMobileSidebar = () => {
    setShowMobileSidebar(!showMobileSidebar);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <CashierSidebar onToggleSidebar={handleToggleSidebar} />
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
            <CashierSidebar onToggleSidebar={handleToggleSidebar} />
          </div>
        </div>
      )}

      {/* Main content area */}
      <div
        className={`flex-1 flex flex-col overflow-hidden ${
          isCollapsed ? "lg:ml-16" : "lg:ml-64"
        } transition-all duration-300`}
      >
        {/* Mobile header with menu button */}
        <div className="lg:hidden bg-gradient-to-r from-indigo-600 to-blue-500 shadow-md">
          <div className="px-4 py-2">
            <div className="flex items-center h-14">
              <button
                onClick={toggleMobileSidebar}
                className="p-2 rounded-full text-white hover:bg-white/10 focus:outline-none"
                aria-label="Open sidebar"
              >
                <MdMenu className="h-6 w-6" />
              </button>

              <h1 className="text-xl font-bold text-white ml-2">
                Trance Asia Computers
              </h1>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default CashierLayout;