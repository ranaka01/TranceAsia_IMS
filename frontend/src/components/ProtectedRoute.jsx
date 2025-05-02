import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext"	  ;

const ProtectedRoute = () => {
    const { isAuthenticated } = useAuth();
    
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    
    // User is authenticated, render the child routes
    return <Outlet />;
};

export default ProtectedRoute;