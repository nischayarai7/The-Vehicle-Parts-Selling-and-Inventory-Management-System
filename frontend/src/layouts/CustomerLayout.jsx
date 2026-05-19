import React from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import './AdminLayout.css'; // Reusing admin layout styles for consistency

const OPERATIONS_NAV = [
  {
    to: "/customer/dashboard",
    label: "Dashboard",
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 3v18h18M7 16h3v-4H7v4zm5 0h3V9h-3v7zm5 0h3V5h-3v11z"/>
      </svg>
    )
  },
  {
    to: "/customer/appointments",
    label: "Book Appointment",
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    )
  },
  {
    to: "/customer/part-requests",
    label: "Request Part",
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    )
  },
  {
    to: "/customer/reviews",
    label: "Review Services",
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    )
  },
  {
    to: "/customer/orders",
    label: "Order History",
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    )
  },
  {
    to: "/customer/service-history",
    label: "Service History",
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
      </svg>
    )
  },
  {
    to: "/customer/garage",
    label: "My Garage",
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0"/><path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0"/><path d="M5 17H3v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-4 0H9"/>
      </svg>
    )
  }
];

const SETTINGS_NAV = [
  {
    to: "/customer/settings",
    label: "Profile Settings",
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    )
  }
];

const CustomerLayout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
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
              user?.fullName?.charAt(0) || 'C'
            )}
          </div>
          <div className="profile-info">
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{user?.fullName || 'Customer'}</div>
            <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>Premium Member</div>
          </div>
        </div>

        <div className="nav-group-title">Customer Operations</div>
        <nav className="admin-nav">
          {OPERATIONS_NAV.map((item) => (
            <NavLink 
              key={item.to}
              to={item.to} 
              className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
            >
              {item.icon} {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="nav-group-title">Account Settings</div>
        <nav className="admin-nav">
          {SETTINGS_NAV.map((item) => (
            <NavLink 
              key={item.to}
              to={item.to} 
              className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}
            >
              {item.icon} {item.label}
            </NavLink>
          ))}
          <button onClick={handleLogout} className="nav-item" style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}>
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg> <span>Logout Session</span>
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="admin-main">
        <header className="admin-top-bar">
          <div className="top-bar-left">
            <h2>Customer Dashboard</h2>
          </div>
          <div className="top-bar-right" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Link 
              to="/" 
              style={{ 
                color: '#fff', 
                textDecoration: 'none', 
                fontWeight: 'bold', 
                fontSize: '14px', 
                background: '#0d1117', 
                padding: '6px 12px', 
                borderRadius: '4px', 
                border: '1px solid #2f363d',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#1890ff';
                e.currentTarget.style.background = 'rgba(24, 144, 255, 0.1)';
                e.currentTarget.style.color = '#1890ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#2f363d';
                e.currentTarget.style.background = '#0d1117';
                e.currentTarget.style.color = '#fff';
              }}
            >
              <svg style={{ width: '16px', height: '16px', color: '#f85149' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <span style={{ fontWeight: '800', letterSpacing: '0.5px' }}>
                <span style={{ color: '#f85149' }}>6ix</span>
                <span style={{ color: '#ffffff' }}>7even</span>
              </span>
            </Link>
            <div className="notification-bell">
              <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <span className="notif-badge">0</span>
            </div>
          </div>
        </header>

        <Outlet />
      </div>
    </div>
  );
};

export default CustomerLayout;
