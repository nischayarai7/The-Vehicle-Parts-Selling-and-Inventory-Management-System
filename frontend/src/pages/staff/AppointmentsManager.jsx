import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import './AppointmentsManager.css';

const AppointmentsManager = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  
  // Toast notifications
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const data = await api.getAllAppointments();
      setAppointments(data || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load active appointments list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    setActionLoading(id);
    try {
      await api.updateAppointmentStatus(id, newStatus);
      showToast(`Appointment #${id} successfully marked as ${newStatus}!`, 'success');
      fetchAppointments();
    } catch (err) {
      showToast(err.message || 'Failed to update appointment status.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Calculate dynamic stats
  const totalCount = appointments.length;
  const pendingCount = appointments.filter(a => a.status === 'Pending').length;
  const confirmedCount = appointments.filter(a => a.status === 'Confirmed').length;
  const completedCount = appointments.filter(a => a.status === 'Completed').length;

  // Search & Filter processing
  const filteredAppointments = appointments.filter(app => {
    const matchesFilter = activeFilter === 'All' || app.status === activeFilter;
    const matchesSearch = 
      (app.customerName && app.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (app.serviceType && app.serviceType.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (app.vehicleName && app.vehicleName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (app.id && app.id.toString().includes(searchTerm));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="appointments-manager-container">
      {/* Toast Notification */}
      {toast && (
        <div className={`appointments-toast ${toast.type}`}>
          <span>{toast.type === 'success' ? (
            <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          ) : (
            <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          )}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="appointments-header">
        <div>
          <h2>Appointments Scheduler</h2>
          <p style={{ color: 'var(--admin-text-muted)', fontSize: '13px', margin: '4px 0 0 0' }}>
            Approve, schedule, and finalize vehicle service bookings in real time.
          </p>
        </div>
        <button onClick={fetchAppointments} className="btn-refresh-action" disabled={loading}>
          <svg className={`refresh-icon-svg ${loading ? 'spinning' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          <span>{loading ? 'Refreshing...' : 'Refresh Records'}</span>
        </button>
      </div>

      {/* Dynamic Statistics counters */}
      <div className="appointments-stats-row">
        <div className="appointment-stat-card">
          <div className="stat-icon total"><svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
          <div className="stat-details">
            <span className="stat-num">{totalCount}</span>
            <span className="stat-label">Total Bookings</span>
          </div>
        </div>

        <div className="appointment-stat-card">
          <div className="stat-icon pending"><svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
          <div className="stat-details">
            <span className="stat-num">{pendingCount}</span>
            <span className="stat-label">Pending Approval</span>
          </div>
        </div>

        <div className="appointment-stat-card">
          <div className="stat-icon confirmed"><svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
          <div className="stat-details">
            <span className="stat-num">{confirmedCount}</span>
            <span className="stat-label">Confirmed Slots</span>
          </div>
        </div>

        <div className="appointment-stat-card">
          <div className="stat-icon completed"><svg style={{ width: '18px', height: '18px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
          <div className="stat-details">
            <span className="stat-num">{completedCount}</span>
            <span className="stat-label">Services Done</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="appointments-filter-box">
        <div className="search-input-wrapper">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input 
            type="text" 
            placeholder="Search by customer, vehicle, or service..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>

        <div className="filter-tabs">
          {['All', 'Pending', 'Confirmed', 'Completed', 'Cancelled'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`filter-tab-btn ${activeFilter === tab ? 'active' : ''}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments Ledger Card */}
      <div className="appointments-ledger-card">
        {loading && appointments.length === 0 ? (
          <div className="loading-block">
            <div className="loading-spinner"></div>
            <p style={{ marginTop: '16px' }}>Fetching operational appointments...</p>
          </div>
        ) : (
          <div className="ledger-table-container">
            <table className="ledger-table">
              <thead>
                <tr>
                  <th>Ref ID</th>
                  <th>Appointment Date & Time</th>
                  <th>Customer Profile</th>
                  <th>Customer Vehicle</th>
                  <th>Requested Service</th>
                  <th>Booking Status</th>
                  <th>Administrative Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: 'var(--admin-text-muted)', padding: '36px' }}>
                      No active bookings found matching your parameters.
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map(app => (
                    <tr key={app.id}>
                      <td style={{ fontWeight: '700', color: '#fff' }}>#{app.id}</td>
                      <td style={{ fontWeight: '500' }}>
                        {new Date(app.appointmentDate).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td style={{ fontWeight: '600', color: '#fff' }}>{app.customerName}</td>
                      <td>{app.vehicleName || 'Walk-in Client'}</td>
                      <td>
                        <span style={{ color: 'var(--admin-primary)', fontWeight: '600' }}>
                          {app.serviceType}
                        </span>
                      </td>
                      <td>
                        <span className={`status-tag ${app.status.toLowerCase()}`}>
                          {app.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {actionLoading === app.id ? (
                            <span style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>
                              Processing...
                            </span>
                          ) : (
                            <>
                              {app.status === 'Pending' && (
                                <button 
                                  onClick={() => updateStatus(app.id, 'Confirmed')} 
                                  className="btn-action-control confirm"
                                >
                                  <svg style={{ width: '12px', height: '12px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg> Confirm
                                </button>
                              )}
                              {app.status === 'Confirmed' && (
                                <button 
                                  onClick={() => updateStatus(app.id, 'Completed')} 
                                  className="btn-action-control complete"
                                >
                                  <svg style={{ width: '12px', height: '12px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Complete
                                </button>
                              )}
                              {(app.status === 'Pending' || app.status === 'Confirmed') && (
                                <button 
                                  onClick={() => updateStatus(app.id, 'Cancelled')} 
                                  className="btn-action-control cancel"
                                >
                                  <svg style={{ width: '12px', height: '12px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Cancel
                                </button>
                              )}
                              {app.status === 'Completed' && (
                                <span style={{ fontSize: '11.5px', color: '#2ea043', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <svg style={{ width: '12px', height: '12px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Fulfilled
                                </span>
                              )}
                              {app.status === 'Cancelled' && (
                                <span style={{ fontSize: '11.5px', color: '#f85149', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <svg style={{ width: '12px', height: '12px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg> Dismissed
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentsManager;
