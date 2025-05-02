import React from 'react';
import { useAuth } from './AuthContext'

/**
 * Component to conditionally render UI elements based on user role
 * @param {Array} roles - Array of roles allowed to see the children
 * @param {React.ReactNode} children - The content to show if user has permission
 * @param {React.ReactNode} fallback - Optional content to show if user doesn't have permission
 */
const RoleBasedUI = ({ roles, children, fallback = null }) => {
  const { hasAnyRole } = useAuth();
  
  // If user has any of the required roles, render children
  if (hasAnyRole(roles)) {
    return <>{children}</>;
  }
  
  // Otherwise render fallback or nothing
  return fallback ? <>{fallback}</> : null;
};

export default RoleBasedUI;