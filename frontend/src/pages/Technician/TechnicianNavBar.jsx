import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdMenu, MdLogout } from 'react-icons/md';
import { jwtDecode } from 'jwt-decode';
import API from '../../utils/api';
import TechnicianUserSettings from './TechnicianUserSettings';

const Navbar = ({ toggleMobileSidebar }) => {
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const [userData, setUserData] = useState({
    id: null,
    username: '',
    role: ''
  });
  const [profileImage, setProfileImage] = useState(null);
  
  // Fetch user data from token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserData({
          id: decoded.userId,
          username: decoded.username || '',
          role: decoded.role || ''
        });
      } catch (error) {
        console.error('Error decoding token:', error);
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
            setProfileImage(`http://localhost:5000/uploads/${response.data.data.user.profile_image}`);
          }
        } catch (error) {
          console.error('Error fetching profile image:', error);
        }
      };
      
      fetchProfileImage();
    }
  }, [userData.id]);
  
  const showUserSettings = () => {
    setShowSettings(true);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="sticky top-0 z-20 bg-gradient-to-r from-indigo-600 to-blue-500 shadow-md">
      <div className="px-4 py-2">
        <div className="flex items-center justify-between h-14">
          {/* Left side - Mobile menu toggle and title */}
          <div className="flex items-center">
            <button 
              onClick={toggleMobileSidebar}
              className="lg:hidden p-2 rounded-full text-white hover:bg-white/10 focus:outline-none"
              aria-label="Open sidebar"
            >
              <MdMenu className="h-6 w-6" />
            </button>
            
            <h1 className="text-xl font-bold text-white ml-2 lg:ml-6">
              Trance Asia Computers
            </h1>
          </div>
          
          {/* Right side - User info and logout */}
          <div className="flex items-center space-x-4">
            {/* Current page or date */}
            <div className="hidden md:block">
              <p className="text-white/80 text-sm">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            
            {/* User profile */}
            <div className="flex items-center">
              <div className="text-right mr-3 hidden sm:block">
                <p className="text-white font-medium leading-tight">{userData.username || 'User'}</p>
                <p className="text-white/80 text-xs">{userData.role || 'Role'}</p>
              </div>
              
              {/* Profile image - clickable to view profile */}
              <div 
                onClick={showUserSettings}
                className="cursor-pointer"
                title="User Settings"
              >
                {profileImage ? (
                  <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-white shadow-md hover:scale-105 transition-transform">
                    <img 
                      src={profileImage} 
                      alt="Profile" 
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-indigo-600 font-bold border-2 border-white shadow-md hover:scale-105 transition-transform">
                    {userData.username ? userData.username.substring(0, 2).toUpperCase() : "U"}
                  </div>
                )}
              </div>
            </div>
            
            {/* Logout button with red color */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-full text-red-600 hover:bg-red-50"
              aria-label="Logout"
              title="Logout"
            >
              <MdLogout className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
      
      {/* User Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen">
            <div className="fixed inset-0 bg-black opacity-50"></div>
            <div className="relative bg-white w-full max-w-4xl rounded-lg shadow-lg overflow-hidden">
              <TechnicianUserSettings onClose={() => setShowSettings(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
