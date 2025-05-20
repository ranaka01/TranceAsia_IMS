import React from 'react';
import TechnicianUserSettings from './TechnicianUserSettings';
import RepairManagement from './TechnicianDashboard';
import Navbar from './TechnicianNavbar';

const TechnicianHome = () => {
  return (
    <div>
      <Navbar />
      <RepairManagement />
      
    </div>
  )
}

export default TechnicianHome