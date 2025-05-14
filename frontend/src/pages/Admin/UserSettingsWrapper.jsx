import React, { useState } from 'react';
import UserSettings from './UserSettings';
import Sidebar from './Sidebar'; // Adjust the import path as needed

const UserSettingsWrapper = ({ onClose }) => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 ml-16 md:ml-64">
        <UserSettings onClose={onClose} />
      </div>
    </div>
  );
};

export default UserSettingsWrapper;