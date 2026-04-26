import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const StaffRoute = ({ children }) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'Admin' && user.role !== 'Staff') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default StaffRoute;
