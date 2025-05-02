import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

// Create a context for authentication state
const AuthContext = createContext(null);

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component that wraps the app and makes auth object available to any child component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated on initial load
    const checkAuthStatus = () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const decoded = jwtDecode(token);
          
          // Check if token is expired
          const currentTime = Date.now() / 1000;
          if (decoded.exp < currentTime) {
            localStorage.removeItem('token');
            setUser(null);
          } else {
            // Set user info including the role
            setUser({
              id: decoded.userId,
              email: decoded.email,
              role: decoded.role,
              exp: decoded.exp
            });
          }
        } catch (error) {
          console.error('Failed to decode token:', error);
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuthStatus();
    
    // Set up an interval to check token validity periodically
    const intervalId = setInterval(() => {
      checkAuthStatus();
    }, 5 * 60 * 1000); // Check every 5 minutes
    
    return () => clearInterval(intervalId);
  }, []);

  // Login function that stores the token and sets user info
  const login = (token) => {
    localStorage.setItem('token', token);
    try {
      const decoded = jwtDecode(token);
      setUser({
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        exp: decoded.exp
      });
    } catch (error) {
      console.error('Failed to decode token:', error);
    }
  };

  // Logout function that clears the token and user info
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // Check if user has a specific role
  const hasRole = (requiredRole) => {
    return user && user.role === requiredRole;
  };

  // Check if user has one of the required roles
  const hasAnyRole = (requiredRoles) => {
    return user && requiredRoles.includes(user.role);
  };

  // Context value that will be provided to consumers
  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    hasRole,
    hasAnyRole
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : null}
    </AuthContext.Provider>
  );
};

export default AuthContext;