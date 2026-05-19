import React from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { api } from '../services/api';
import './AdminLayout.css';

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

const AdminLayout = () => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [panelData, setPanelData] = React.useState({
    usersCount: 0,
    ordersCount: 0,
    partsCount: 0,
    appointmentsCount: 0,
    recentUser: 'New user registered',
    recentPart: 'New products added',
    contactsList: [],
    lowStockAlerts: [],
    recentOrders: []
  });
  const navigate = useNavigate();
  const location = useLocation();
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

        const lowStock = parts.filter(p => p.stockQuantity < 10);

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
          lowStockAlerts: lowStock,
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

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/admin') return 'Overview';
    if (path.startsWith('/admin/parts')) return 'Parts Manager';
    if (path.startsWith('/admin/categories')) return 'Categories';
    if (path.startsWith('/admin/vehicles')) return 'Vehicle Registry';
    if (path.startsWith('/admin/vendors')) return 'Vendors';
    if (path.startsWith('/admin/orders')) return 'Customer Orders';
    if (path.startsWith('/admin/purchase-invoices')) return 'Purchase Invoices';
    if (path.startsWith('/admin/reports')) return 'Financial Reports';
    if (path.startsWith('/admin/reviews')) return 'Customer Feedbacks';
    if (path.startsWith('/admin/roles')) return 'Role Manager';
    if (path.startsWith('/admin/permissions')) return 'Permissions';
    if (path.startsWith('/admin/users')) return 'User Accounts';
    if (path.startsWith('/admin/settings')) return 'Profile Settings';
    return 'Overview';
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

        <div className="admin-sidebar-nav-container">
          {/* Group 1: Core & Analytics */}
          <div className="nav-group-title" style={{ marginTop: 0 }}>Core & Analytics</div>
          <nav className="admin-nav" style={{ marginBottom: '16px' }}>
            <NavLink to="/admin" end className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18M7 16h3v-4H7v4zm5 0h3V9h-3v7zm5 0h3V5h-3v11z"/></svg> Overview
            </NavLink>
            <NavLink to="/admin/reports" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> Financial Reports
            </NavLink>
          </nav>

          {/* Group 2: Inventory & Catalog */}
          <div className="nav-group-title">Inventory & Catalog</div>
          <nav className="admin-nav" style={{ marginBottom: '16px' }}>
            <NavLink to="/admin/parts" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 8l-9-4-9 4v8l9 4 9-4V8zM12 4v16m-9-12l9 4 9-4"/></svg> Parts Manager
            </NavLink>
            <NavLink to="/admin/categories" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> Categories
            </NavLink>
            <NavLink to="/admin/vehicles" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-1.1 0-2 .9-2 2v7c0 .6.4 1 1 1h3M9 17a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm11 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/></svg> Vehicle Registry
            </NavLink>
          </nav>

          {/* Group 3: Supply Chain & Purchasing */}
          <div className="nav-group-title">Supply Chain & Purchasing</div>
          <nav className="admin-nav" style={{ marginBottom: '16px' }}>
            <NavLink to="/admin/vendors" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M3 7l9-4 9 4M4 7v14m16-14v14M9 21V11h6v10"/></svg> Vendors
            </NavLink>
            <NavLink to="/admin/purchase-invoices" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> Purchase Invoices
            </NavLink>
          </nav>

          {/* Group 4: Sales & Testimonials */}
          <div className="nav-group-title">Sales & Testimonials</div>
          <nav className="admin-nav" style={{ marginBottom: '16px' }}>
            <NavLink to="/admin/orders" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg> Customer Orders
            </NavLink>
            <NavLink to="/admin/reviews" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> Customer Feedbacks
            </NavLink>
          </nav>

          {/* Group 5: Access Control & Accounts */}
          <div className="nav-group-title">Identity & Access Control</div>
          <nav className="admin-nav" style={{ marginBottom: '16px' }}>
            <NavLink to="/admin/users" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87m-4-12a4 4 0 0 1 0 7.75"/></svg> User Accounts
            </NavLink>
            <NavLink to="/admin/roles" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> Role Manager
            </NavLink>
            <NavLink to="/admin/permissions" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="7.5" cy="15.5" r="5.5"/><path d="M21 2l-9.6 9.6m5.8-5.8l-3 3m5.5-2.5l-3 3"/></svg> Permissions
            </NavLink>
          </nav>

          {/* Group 6: Settings */}
          <div className="nav-group-title">System Settings</div>
          <nav className="admin-nav">
            <NavLink to="/admin/settings" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> Profile Settings
            </NavLink>
            <button onClick={handleLogout} className="nav-item logout-btn" style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' }}>
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4m7 14l5-5-5-5m5 5H9"/></svg> Logout
            </button>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-top-bar">
          <h1>{getPageTitle()}</h1>
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
          {/* Low Stock Alerts */}
          {panelData.lowStockAlerts.length > 0 ? (
            panelData.lowStockAlerts.slice(0, 2).map((p) => (
              <div 
                className="notification-item warning-alert clickable" 
                key={`stock-${p.id}`}
                onClick={() => {
                  setSearchTerm(p.name);
                  navigate('/admin/parts');
                }}
                style={{ cursor: 'pointer', background: 'rgba(227, 59, 59, 0.05)', padding: '8px 12px', borderRadius: '8px', borderLeft: '3px solid #ff4d4f', marginBottom: '8px' }}
              >
                <div className="item-content">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ff4d4f', marginBottom: '4px' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px' }}>
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                      <line x1="12" y1="9" x2="12" y2="13"></line>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    <p style={{ fontWeight: '700', fontSize: '12px', margin: 0 }}>LOW STOCK ALERT</p>
                  </div>
                  <p style={{ margin: '2px 0 0 0', fontWeight: '500', fontSize: '13px' }}>{p.name}</p>
                  <span style={{ color: '#ffa39e', fontSize: '11px' }}>Only {p.stockQuantity} left (Reorder: {p.reorderLevel})</span>
                </div>
              </div>
            ))
          ) : (
            <div className="notification-item" style={{ background: 'rgba(82, 196, 26, 0.05)', padding: '8px 12px', borderRadius: '8px', borderLeft: '3px solid #52c41a', marginBottom: '8px' }}>
              <div className="item-content">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#52c41a', marginBottom: '4px' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px' }}>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <p style={{ fontWeight: '700', fontSize: '12px', margin: 0 }}>INVENTORY STABLE</p>
                </div>
                <span style={{ color: '#b7eb8f', fontSize: '11px' }}>All parts stock levels optimal</span>
              </div>
            </div>
          )}
        </div>

        <div className="right-panel-section">
          <h4>Recent Activity</h4>
          <div className="activity-item clickable" onClick={() => navigate('/admin/users')} style={{ cursor: 'pointer', background: 'rgba(255, 255, 255, 0.02)', padding: '8px 12px', borderRadius: '8px', marginBottom: '8px' }}>
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
          <div className="activity-item clickable" onClick={() => navigate('/admin/parts')} style={{ cursor: 'pointer', background: 'rgba(255, 255, 255, 0.02)', padding: '8px 12px', borderRadius: '8px' }}>
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

export default AdminLayout;
