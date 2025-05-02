import React from "react";
import { Outlet } from "react-router-dom";
import CashierSidebar from "./CashierSideBar";


const CashierLayout = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar component */}
      <CashierSidebar/>
      
      {/* Main content area */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default CashierLayout;