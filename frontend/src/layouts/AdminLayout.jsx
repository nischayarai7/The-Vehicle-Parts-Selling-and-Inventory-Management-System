import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import './AdminLayout.css';

const AdminLayout = () => {
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
              user?.fullName?.charAt(0) || 'A'
            )}
          </div>
          <div className="profile-info">
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{user?.fullName || 'Admin'}</div>
            <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>Administrator</div>
          </div>
        </div>

        <div className="admin-search-box">
          <span>🔍</span>
          <input type="text" placeholder="Search..." />
        </div>

        <div className="nav-group-title">Dashboards</div>
        <nav className="admin-nav">
          <NavLink to="/admin" end className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span>📊</span> Overview
          </NavLink>
          <NavLink to="/admin/parts" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span>📦</span> Parts Manager
          </NavLink>
          <NavLink to="/admin/categories" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span>📁</span> Categories
          </NavLink>
          <NavLink to="/admin/roles" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span>🛡️</span> Role Manager
          </NavLink>
          <NavLink to="/admin/permissions" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span>🔑</span> Permissions
          </NavLink>
        </nav>

        <div className="nav-group-title">Settings</div>
        <nav className="admin-nav">
          <NavLink to="/admin/users" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span>👥</span> User Accounts
          </NavLink>
          <NavLink to="/admin/settings" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <span>⚙️</span> Profile Settings
          </NavLink>
          <button onClick={handleLogout} className="nav-item" style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer' }}>
            <span>🚪</span> Logout
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-top-bar">
          <h1>Overview</h1>
          <div className="top-bar-actions">
            <button className="btn-primary" onClick={() => navigate('/')}>Storefront</button>
          </div>
        </header>

        <div className="admin-content">
          <Outlet />
        </div>
      </main>

      {/* Right Sidebar */}
      <aside className="admin-right-panel">
        <div className="right-panel-section">
          <h4>Notifications</h4>
          <div className="notification-item">
            <div className="dot"></div>
            <div className="item-content">
              <p>56 New users registered</p>
              <span>Just now</span>
            </div>
          </div>
          <div className="notification-item">
            <div className="dot"></div>
            <div className="item-content">
              <p>132 Orders placed</p>
              <span>59 minutes ago</span>
            </div>
          </div>
        </div>

        <div className="right-panel-section">
          <h4>Recent Activity</h4>
          <div className="activity-item">
            <div className="item-content">
              <p>Changed the style</p>
              <span>Just now</span>
            </div>
          </div>
          <div className="activity-item">
            <div className="item-content">
              <p>177 New products added</p>
              <span>47 minutes ago</span>
            </div>
          </div>
        </div>

        <div className="right-panel-section">
          <h4>Contacts</h4>
          <div className="activity-item">
            <div className="profile-avatar" style={{ width: '24px', height: '24px', fontSize: '10px' }}>DC</div>
            <div className="item-content">
              <p>Daniel Craig</p>
              <span>Online</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default AdminLayout;
