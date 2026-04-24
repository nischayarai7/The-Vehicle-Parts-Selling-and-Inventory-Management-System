import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const AdminRoute = ({ children }) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  console.log("[AdminRoute] Check:", { isAuthenticated, role: user?.role });

  // If not logged in, redirect to login
  if (!isAuthenticated || !user) {
    console.warn("[AdminRoute] Access Denied: Not authenticated.");
    return <Navigate to="/login" replace />;
  }

  // If logged in but not an Admin, redirect to the homepage
  if (user.role !== 'Admin') {
    console.warn("[AdminRoute] Access Denied: Role is not Admin. Current role:", user.role);
    return <Navigate to="/" replace />;
  }

  // If authenticated AND is an Admin, render the children (Admin Dashboard)
  return children;
};

export default AdminRoute;
