import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { api } from '../services/api';
import './staff/StaffDashboard.css'; // Reusing staff dashboard styles for consistency

const DASHBOARD_OPERATIONS = [
  {
    icon: <svg style={{ width: '22px', height: '22px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    title: "Book Appointment",
    description: "Schedule a service or repair appointment with our expert mechanics.",
    to: "/customer/appointments",
    btnText: "Book Now ➔"
  },
  {
    icon: <svg style={{ width: '22px', height: '22px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
    title: "Request Part",
    description: "Can't find a part? Request it here and we will source it for you.",
    to: "/customer/part-requests",
    btnText: "Request Part ➔"
  },
  {
    icon: <svg style={{ width: '22px', height: '22px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
    title: "Review Services",
    description: "Rate your experience and help us improve our services.",
    to: "/customer/reviews",
    btnText: "Leave Review ➔"
  }
];

const CustomerDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  
  const [stats, setStats] = useState({
    activeAppointments: 0,
    pendingRequests: 0,
    totalOrders: 0
  });
  
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dynamic dependencies in parallel
      const [appointmentsRes, requestsRes, ordersRes] = await Promise.all([
        api.getMyAppointments().catch(() => ({ data: [] })),
        api.getMyPartRequests().catch(() => []),
        api.getMyOrders().catch(() => [])
      ]);

      const appointments = appointmentsRes.data || (Array.isArray(appointmentsRes) ? appointmentsRes : []);
      const requests = requestsRes.data || (Array.isArray(requestsRes) ? requestsRes : []);
      const orders = ordersRes.data || (Array.isArray(ordersRes) ? ordersRes : []);

      const activeAppointments = appointments.filter(a => a.status === 'Pending' || a.status === 'Confirmed').length;
      const pendingRequests = requests.filter(r => r.status === 'Pending').length;
      const totalOrders = orders.length;

      setStats({
        activeAppointments,
        pendingRequests,
        totalOrders
      });

      // Get latest 5 recent appointments
      const sortedAppointments = [...appointments]
        .sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate))
        .slice(0, 5);
      
      setRecentAppointments(sortedAppointments);

    } catch (err) {
      console.error('Failed to load customer dashboard stats:', err);
    } finally {
      setLoading(false);
    }
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
        <p style={{ marginTop: '16px' }}>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="staff-dashboard-container">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-text">
          <h2>Welcome Back, {user?.fullName || 'Customer'}!</h2>
          <p>Here is your overview at 6ix7even Auto Parts today.</p>
        </div>
        <div className="welcome-date-badge">
          <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> {todayDateString}
        </div>
      </div>

      {/* Dynamic KPI summary row */}
      <div className="staff-kpi-grid">
        <div className="staff-kpi-card">
          <div className="kpi-icon-wrapper invoices">
            <svg style={{ width: '22px', height: '22px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div className="kpi-info-content">
            <span className="kpi-title">Active Appointments</span>
            <span className="kpi-value">{stats.activeAppointments}</span>
          </div>
        </div>

        <div className="staff-kpi-card">
          <div className="kpi-icon-wrapper parts">
            <svg style={{ width: '22px', height: '22px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
          </div>
          <div className="kpi-info-content">
            <span className="kpi-title">Pending Part Requests</span>
            <span className="kpi-value">{stats.pendingRequests}</span>
          </div>
        </div>

        <div className="staff-kpi-card">
          <div className="kpi-icon-wrapper customers">
            <svg style={{ width: '22px', height: '22px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          </div>
          <div className="kpi-info-content">
            <span className="kpi-title">Total Orders</span>
            <span className="kpi-value">{stats.totalOrders}</span>
          </div>
        </div>
      </div>

      {/* Grid Menu Navigation */}
      <div className="operation-menu-grid">
        {DASHBOARD_OPERATIONS.map((op, idx) => (
          <div key={idx} className="operation-nav-card">
            <div className="card-top-icon">
              {op.icon}
            </div>
            <h3>{op.title}</h3>
            <p>{op.description}</p>
            <Link to={op.to} className="btn-card-launch">{op.btnText}</Link>
          </div>
        ))}
      </div>

      {/* Recent Appointments Section */}
      <div className="recent-invoices-section">
        <div className="recent-invoices-header">
          <h3>Your Recent Appointments</h3>
          <Link to="/appointments" className="btn-table-action" style={{ fontSize: '12px' }}>
            View All
          </Link>
        </div>
        <div className="recent-table-wrapper">
          <table className="recent-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Service Type</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {recentAppointments.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', color: 'var(--admin-text-muted)', padding: '24px' }}>
                    No appointments booked yet.
                  </td>
                </tr>
              ) : (
                recentAppointments.map((a) => (
                  <tr key={a.id}>
                    <td style={{ fontWeight: '600', color: '#fff' }}>
                      {new Date(a.appointmentDate).toLocaleDateString()}
                    </td>
                    <td>{a.serviceType}</td>
                    <td>
                      <span className={`status-pill ${a.status.toLowerCase()}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="text-muted">{a.notes || 'N/A'}</td>
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

export default CustomerDashboard;
