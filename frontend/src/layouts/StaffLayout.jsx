import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import './AdminLayout.css';

const StaffLayout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      {/* Left Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-profile-top">
          <div className="profile-avatar">
            {user?.avatarUrl ? (
              <img 
                src={user.avatarUrl} 
                alt="Profile" 
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
              />
            ) : (
              user?.fullName?.charAt(0) || 'S'
            )}
          </div>
          <div className="profile-info">
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{user?.fullName || 'Staff Member'}</div>
            <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>Staff</div>
          </div>
        </div>

        <div className="nav-group-title">Operations</div>
        <nav className="admin-nav">
          <NavLink to="/staff/dashboard" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span>📊</span> Dashboard
          </NavLink>
          <NavLink to="/staff/pos" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span>🛒</span> Point of Sale
          </NavLink>
          <NavLink to="/staff/customers" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span>👥</span> Customer Directory
          </NavLink>
          <NavLink to="/staff/appointments" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span>📅</span> Appointments
          </NavLink>
          <NavLink to="/staff/register-customer" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span>➕</span> Register Customer
          </NavLink>
        </nav>

        <div className="nav-group-title">Settings</div>
        <nav className="admin-nav">
          <button onClick={handleLogout} className="nav-item" style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}>
            <span>🚪</span> Logout
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-top-bar">
          <h1>Staff Portal</h1>
          <div className="top-bar-actions">
            <button className="btn-primary" onClick={() => navigate('/')}>Storefront</button>
          </div>
        </header>

        <div className="admin-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default StaffLayout;
