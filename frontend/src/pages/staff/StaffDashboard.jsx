import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { api } from '../../services/api';
import './StaffDashboard.css';



const StaffDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  
  const [stats, setStats] = useState({
    todaySales: 0,
    todayTransactions: 0,
    totalCustomers: 0,
    activeDebts: 0,
    totalRevenue: 0
  });
  
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dynamic dependencies in parallel, fail-safe reports
      const [ordersRes, customersRes, reportsRes] = await Promise.all([
        api.getStaffOrders().catch(() => []),
        api.getStaffCustomers().catch(() => ({ data: [] })),
        api.getStaffCustomerReports().catch(() => ({ regulars: [], highSpenders: [], pendingCredits: [] }))
      ]);

      // Calculate Today's Stats
      const todayStr = new Date().toDateString();
      const allOrders = ordersRes || [];
      
      const todayOrders = allOrders.filter(o => 
        o.createdAt && new Date(o.createdAt).toDateString() === todayStr
      );

      const todaySales = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
      const todayTransactions = todayOrders.length;
      
      // Calculate Total Customer count
      const totalCustomers = customersRes?.data?.length || customersRes?.length || 0;
      
      // Calculate Active Debts from customer pending credits
      const pendingCredits = reportsRes?.pendingCredits || reportsRes?.data?.pendingCredits || [];
      const activeDebts = pendingCredits.reduce((sum, c) => sum + (c.pendingAmount || 0), 0);

      // Calculate Total Revenue from all orders
      const totalRevenue = allOrders.reduce((sum, o) => sum + o.totalAmount, 0);

      setStats({
        todaySales,
        todayTransactions,
        totalCustomers,
        activeDebts,
        totalRevenue
      });

      // Get latest 5 recent orders overall
      const sortedOrders = [...allOrders]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
      
      setRecentOrders(sortedOrders);

    } catch (err) {
      console.error('Failed to load staff dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 2
    }).format(amount).replace('NPR', 'Rs.');
  };

  const todayDateString = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  if (loading) {
    return (
      <div className="spinner-wrapper">
        <div className="loading-spinner"></div>
        <p style={{ marginTop: '16px' }}>Initializing staff operations command center...</p>
      </div>
    );
  }

  return (
    <div className="staff-dashboard-container">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-text">
          <h2>Welcome Back, {user?.fullName || 'Staff Member'}!</h2>
          <p>Here is the active operational command overview for 6ix7even Auto Parts today.</p>
        </div>
        <div className="welcome-date-badge">
          <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> {todayDateString}
        </div>
      </div>

      {/* Dynamic KPI summary row */}
      <div className="staff-kpi-grid">
        <div className="staff-kpi-card">
          <div className="kpi-icon-wrapper sales">
            <svg style={{ width: '22px', height: '22px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div className="kpi-info-content">
            <span className="kpi-title">Today's Sales</span>
            <span className="kpi-value">{formatCurrency(stats.todaySales)}</span>
          </div>
        </div>

        <div className="staff-kpi-card">
          <div className="kpi-icon-wrapper revenue">
            <svg style={{ width: '22px', height: '22px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <div className="kpi-info-content">
            <span className="kpi-title">Total Revenue</span>
            <span className="kpi-value">{formatCurrency(stats.totalRevenue)}</span>
          </div>
        </div>

        <div className="staff-kpi-card">
          <div className="kpi-icon-wrapper invoices">
            <svg style={{ width: '22px', height: '22px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <div className="kpi-info-content">
            <span className="kpi-title">Today's Invoices</span>
            <span className="kpi-value">{stats.todayTransactions} finalized</span>
          </div>
        </div>

        <div className="staff-kpi-card">
          <div className="kpi-icon-wrapper customers">
            <svg style={{ width: '22px', height: '22px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87m-4-12a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div className="kpi-info-content">
            <span className="kpi-title">Registered Clients</span>
            <span className="kpi-value">{stats.totalCustomers} active</span>
          </div>
        </div>

        <div className="staff-kpi-card">
          <div className="kpi-icon-wrapper debts">
            <svg style={{ width: '22px', height: '22px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <div className="kpi-info-content">
            <span className="kpi-title">Outstanding Credit</span>
            <span className="kpi-value" style={{ color: stats.activeDebts > 0 ? '#e04f5f' : '#fff' }}>
              {formatCurrency(stats.activeDebts)}
            </span>
          </div>
        </div>
      </div>



      {/* Recent Invoices Section */}
      <div className="recent-invoices-section">
        <div className="recent-invoices-header">
          <h3>Recent POS Finalized Invoices</h3>
          <Link to="/staff/customers" className="btn-table-action" style={{ fontSize: '12px' }}>
            View Full Ledger
          </Link>
        </div>
        <div className="recent-table-wrapper">
          <table className="recent-table">
            <thead>
              <tr>
                <th>Invoice Ref</th>
                <th>Client Name</th>
                <th>Billed Total</th>
                <th>Status</th>
                <th>Finalized Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--admin-text-muted)', padding: '24px' }}>
                    No invoices processed recently.
                  </td>
                </tr>
              ) : (
                recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td style={{ fontWeight: '600', color: '#fff' }}>{o.orderNumber}</td>
                    <td>{o.customerName || 'Walk-in Client'}</td>
                    <td style={{ fontWeight: '600' }}>{formatCurrency(o.totalAmount)}</td>
                    <td>
                      <span className={`status-pill ${o.status.toLowerCase()}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="text-muted">
                      {new Date(o.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td>
                      <Link to={`/staff/invoice/${o.id}`} className="btn-table-action">
                        <svg style={{ width: '12px', height: '12px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> View Invoice
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
