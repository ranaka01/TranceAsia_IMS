import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";	

/**
 * Role-based route component that restricts access based on user roles
 * @param {Array} allowedRoles - Array of roles that can access this route
 * @returns Outlet if user has permission, Navigate to denied page if not
 */
const RoleBasedRoute = ({ allowedRoles }) => {
  const { user, isAuthenticated, hasAnyRole } = useAuth();
  
  // If user is not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Check if the user's role is included in the allowed roles
  if (!hasAnyRole(allowedRoles)) {
    // User doesn't have required role, redirect to access denied page
    return <Navigate to="/access-denied" replace />;
  }
  
  // User has the required role, render the child routes
  return <Outlet />;
};

export default RoleBasedRoute;