import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { api } from '../services/api';
import './AdminLayout.css';

const OPERATIONS_NAV = [
  {
    to: "/staff/dashboard",
    label: "Dashboard",
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 3v18h18M7 16h3v-4H7v4zm5 0h3V9h-3v7zm5 0h3V5h-3v11z"/>
      </svg>
    )
  },
  {
    to: "/staff/pos",
    label: "Point of Sale",
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
        <path d="M3 6h18"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    )
  },
  {
    to: "/staff/parts",
    label: "Parts Inventory",
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    )
  },
  {
    to: "/staff/customers",
    label: "Customer Directory",
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87m-4-12a4 4 0 0 1 0 7.75"/>
      </svg>
    )
  },
  {
    to: "/staff/orders",
    label: "Customer Orders",
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="9" cy="21" r="1"/>
        <circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
      </svg>
    )
  },
  {
    to: "/staff/appointments",
    label: "Appointments",
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
    to: "/staff/register-customer",
    label: "Register Customer",
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="8.5" cy="7" r="4"/>
        <line x1="20" y1="8" x2="20" y2="14"/>
        <line x1="17" y1="11" x2="23" y2="11"/>
      </svg>
    )
  },
  {
    to: "/staff/reports",
    label: "Customer Reports",
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10 9 9 9 8 9"></polyline>
      </svg>
    )
  }
];

const SETTINGS_NAV = [
  {
    to: "/staff/settings",
    label: "Profile Settings",
    icon: (
      <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    )
  }
];

const formatRelativeTime = (dateString) => {
  if (!dateString) return 'Just now';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  
  if (isNaN(diffMs) || diffMs < 0) return 'Just now';
  
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  
  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffWeeks === 1) return '1 week ago';
  return `${diffWeeks} weeks ago`;
};

const StaffLayout = () => {
  const [panelData, setPanelData] = React.useState({
    usersCount: 0,
    ordersCount: 0,
    partsCount: 0,
    appointmentsCount: 0,
    recentUser: 'New user registered',
    recentPart: 'New products added',
    contactsList: [],
    recentOrders: []
  });
  const [searchTerm, setSearchTerm] = React.useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  React.useEffect(() => {
    const loadRightPanelData = async () => {
      try {
        const [usersRes, ordersRes, partsRes, appointmentsRes] = await Promise.all([
          api.getUsers().catch(() => []),
          api.getStaffOrders().catch(() => []),
          api.getAllParts().catch(() => []),
          api.getAllAppointments().catch(() => ({ data: [] }))
        ]);

        const users = Array.isArray(usersRes) ? usersRes : (usersRes?.data || []);
        const orders = Array.isArray(ordersRes) ? ordersRes : (ordersRes?.data || []);
        const parts = Array.isArray(partsRes) ? partsRes : (partsRes?.data || []);
        const appointments = appointmentsRes?.data || (Array.isArray(appointmentsRes) ? appointmentsRes : []);

        const sortedUsers = [...users].sort((a, b) => b.id - a.id);
        const sortedParts = [...parts].sort((a, b) => b.id - a.id);
        const sortedOrders = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const recentUserText = sortedUsers.length > 0 
          ? `${sortedUsers[0].fullName || 'New member'} registered`
          : "New user registered";

        const recentPartText = sortedParts.length > 0
          ? `${sortedParts[0].name || 'New catalog item'} added`
          : "New products added";

        // Generate dynamic online contacts from database users
        const otherUsers = users
          .filter(u => u.id !== user?.id)
          .slice(0, 3)
          .map(u => ({
            name: u.fullName || 'Auto Parts Partner',
            initials: (u.fullName || 'AP').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2),
            status: 'Online'
          }));

        setPanelData({
          usersCount: users.length,
          ordersCount: orders.length,
          partsCount: parts.length,
          appointmentsCount: appointments.length,
          recentUser: recentUserText,
          recentPart: recentPartText,
          contactsList: otherUsers.length > 0 ? otherUsers : [
            { name: "Daniel Craig", initials: "DC", status: "Online" },
            { name: "Jessica Alba", initials: "JA", status: "Online" }
          ],
          recentOrders: sortedOrders
        });
      } catch (err) {
        console.error("Failed to load layout panel metadata:", err);
      }
    };

    loadRightPanelData();
  }, [user]);

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

        <div className="admin-sidebar-nav-container">
          <div className="nav-group-title" style={{ marginTop: 0 }}>Operations</div>
          <nav className="admin-nav" style={{ marginBottom: '16px' }}>
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

          <div className="nav-group-title">Settings</div>
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
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14l5-5-5-5m5 5H9"/></svg> Logout
            </button>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-top-bar">
          <h1>Staff Portal</h1>
          <div className="top-bar-actions">
            <button className="btn-storefront" onClick={() => navigate('/')}>
              <svg className="btn-storefront-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              <span>6ix<span className="accent-text">7</span>even</span>
            </button>
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
          {/* Staff System Status */}
          <div className="notification-item" style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '8px 12px', borderRadius: '8px', borderLeft: '3px solid #3b82f6', marginBottom: '8px' }}>
            <div className="item-content">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#3b82f6', marginBottom: '4px' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px' }}>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <p style={{ fontWeight: '700', fontSize: '12px', margin: 0 }}>SYSTEM ONLINE</p>
              </div>
              <span style={{ color: '#93c5fd', fontSize: '11px' }}>Monitoring staff activities</span>
            </div>
          </div>

          {/* Dynamic Recent Orders */}
          {panelData.recentOrders.slice(0, 1).map((o) => (
            <div 
              className="notification-item clickable" 
              key={`order-notif-${o.id}`}
              onClick={() => navigate('/staff/orders')}
              style={{ cursor: 'pointer', background: 'rgba(255, 255, 255, 0.02)', padding: '8px 12px', borderRadius: '8px', borderLeft: '3px solid #3b82f6', marginTop: '10px' }}
            >
              <div className="item-content">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#3b82f6', marginBottom: '4px' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px' }}>
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                  </svg>
                  <p style={{ fontWeight: '700', fontSize: '12px', margin: 0 }}>NEW ORDER RECEIVED</p>
                </div>
                <p style={{ margin: '2px 0 0 0', fontWeight: '500', fontSize: '13px' }}>Order {o.orderNumber || `#${o.id}`} placed</p>
                <span style={{ fontSize: '11px' }}>{formatRelativeTime(o.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="right-panel-section">
          <h4>Recent Activity</h4>
          <div className="activity-item clickable" onClick={() => navigate('/staff/customers')} style={{ cursor: 'pointer', background: 'rgba(255, 255, 255, 0.02)', padding: '8px 12px', borderRadius: '8px', marginBottom: '8px' }}>
            <div className="item-content">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px', color: 'var(--admin-accent)' }}>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <p style={{ fontWeight: '600', fontSize: '13px', margin: 0 }}>User registered</p>
              </div>
              <p style={{ margin: '2px 0 0 0', color: 'var(--admin-text-muted)', fontSize: '12px' }}>{panelData.recentUser}</p>
              <span style={{ fontSize: '10px' }}>Active member audit</span>
            </div>
          </div>
          <div className="activity-item clickable" onClick={() => navigate('/staff/parts')} style={{ cursor: 'pointer', background: 'rgba(255, 255, 255, 0.02)', padding: '8px 12px', borderRadius: '8px' }}>
            <div className="item-content">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px', color: 'var(--admin-accent)' }}>
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="8" y1="21" x2="16" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
                <p style={{ fontWeight: '600', fontSize: '13px', margin: 0 }}>Catalog expanded</p>
              </div>
              <p style={{ margin: '2px 0 0 0', color: 'var(--admin-text-muted)', fontSize: '12px' }}>{panelData.recentPart}</p>
              <span style={{ fontSize: '10px' }}>Inventory catalog check</span>
            </div>
          </div>
        </div>


      </aside>
    </div>
  );
};

export default StaffLayout;
