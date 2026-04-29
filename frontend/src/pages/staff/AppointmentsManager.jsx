import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

const AppointmentsManager = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const data = await api.getAllAppointments();
      setAppointments(data);
    } catch (err) {
      console.error(err);
      alert('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      await api.updateAppointmentStatus(id, newStatus);
      fetchAppointments();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="manager-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Appointments Manager</h2>
        <button onClick={fetchAppointments} className="btn-secondary" disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Date & Time</th>
              <th>Customer</th>
              <th>Vehicle</th>
              <th>Service</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.length === 0 ? (
              <tr><td colSpan="7" style={{ textAlign: 'center' }}>No appointments found.</td></tr>
            ) : appointments.map(app => (
              <tr key={app.id}>
                <td>{app.id}</td>
                <td>{new Date(app.appointmentDate).toLocaleString()}</td>
                <td>{app.customerName}</td>
                <td>{app.vehicleName || 'N/A'}</td>
                <td>{app.serviceType}</td>
                <td>
                  <span style={{
                    padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold',
                    background: app.status === 'Pending' ? '#fffbe6' : app.status === 'Confirmed' ? '#e6f7ff' : app.status === 'Completed' ? '#f6ffed' : '#fff1f0',
                    color: app.status === 'Pending' ? '#faad14' : app.status === 'Confirmed' ? '#1890ff' : app.status === 'Completed' ? '#52c41a' : '#ff4d4f'
                  }}>
                    {app.status}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    {app.status === 'Pending' && (
                      <button onClick={() => updateStatus(app.id, 'Confirmed')} style={{ background: '#1890ff', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Confirm</button>
                    )}
                    {app.status === 'Confirmed' && (
                      <button onClick={() => updateStatus(app.id, 'Completed')} style={{ background: '#52c41a', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Complete</button>
                    )}
                    {(app.status === 'Pending' || app.status === 'Confirmed') && (
                      <button onClick={() => updateStatus(app.id, 'Cancelled')} style={{ background: '#ff4d4f', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AppointmentsManager;
