import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import './AdminLayout.css';

const AdminLayout = () => {
  const [searchTerm, setSearchTerm] = React.useState('');
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

        <div className="nav-group-title">Dashboards</div>
        <nav className="admin-nav">
          <NavLink to="/admin" end className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18M7 16h3v-4H7v4zm5 0h3V9h-3v7zm5 0h3V5h-3v11z"/></svg> Overview
          </NavLink>
          <NavLink to="/admin/parts" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 8l-9-4-9 4v8l9 4 9-4V8zM12 4v16m-9-12l9 4 9-4"/></svg> Parts Manager
          </NavLink>
          <NavLink to="/admin/categories" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> Categories
          </NavLink>
          <NavLink to="/admin/vendors" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M3 7l9-4 9 4M4 7v14m16-14v14M9 21V11h6v10"/></svg> Vendors
          </NavLink>
          <NavLink to="/admin/roles" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Role Manager
          </NavLink>
          <NavLink to="/admin/permissions" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6m5.8-5.8l-3 3m5.5-2.5l-3 3"/></svg> Permissions
          </NavLink>
        </nav>

        <div className="nav-group-title">Settings</div>
        <nav className="admin-nav">
          <NavLink to="/admin/users" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87m-4-12a4 4 0 0 1 0 7.75"/></svg> User Accounts
          </NavLink>
          <NavLink to="/admin/settings" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> Profile Settings
          </NavLink>
          <button onClick={handleLogout} className="nav-item" style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14l5-5-5-5m5 5H9"/></svg> Logout
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-top-bar">
          <h1>Overview</h1>
          <div className="top-bar-actions">
            <div className="admin-top-search">
              <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input 
                type="text" 
                placeholder="Search anything..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="btn-primary" onClick={() => navigate('/')}>Storefront</button>
          </div>
        </header>

        <div className="admin-content">
          <Outlet context={{ searchTerm }} />
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
