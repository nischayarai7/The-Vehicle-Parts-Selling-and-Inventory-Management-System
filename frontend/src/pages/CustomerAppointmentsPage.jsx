import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import './ShopPage.css'; // Reusing shop page styles for consistency

const CustomerAppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [myVehicles, setMyVehicles] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    vehicleId: '',
    serviceType: '',
    appointmentDate: '',
    notes: ''
  });

  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchAppointments();
    fetchMyVehicles();
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    try {
      const data = await api.getAvailableSlots();
      setSlots(data);
    } catch (err) {
      console.error('Failed to load slots:', err);
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.getMyAppointments();
      // Handle both object and array responses
      const data = res.data || (Array.isArray(res) ? res : []);
      setAppointments(data);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyVehicles = async () => {
    try {
      // Assuming getMyVehicles exists or we can use getCustomerVehicles if we know customer ID
      // For now let's try to get them or return empty
      const data = await api.getMyVehicles().catch(() => []);
      setMyVehicles(data);
    } catch (err) {
      console.error('Failed to load vehicles:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.serviceType || !formData.appointmentDate) {
      setMessage({ text: 'Service Type and Date are required.', type: 'error' });
      return;
    }

    try {
      setSubmitting(true);
      await api.bookAppointment({
        vehicleId: formData.vehicleId ? parseInt(formData.vehicleId) : null,
        serviceType: formData.serviceType,
        appointmentDate: new Date(formData.appointmentDate).toISOString(),
        notes: formData.notes
      });
      setMessage({ text: 'Appointment booked successfully!', type: 'success' });
      setFormData({ vehicleId: '', serviceType: '', appointmentDate: '', notes: '' });
      fetchAppointments(); // Refresh list
    } catch (err) {
      console.error('Failed to book appointment:', err);
      setMessage({ text: err.message || 'Failed to book appointment. Please try again.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return '#faad14';
      case 'Confirmed': return '#1890ff';
      case 'Completed': return '#52c41a';
      case 'Cancelled': return '#ff4d4f';
      default: return '#888';
    }
  };

  if (loading) {
    return (
      <div className="spinner-wrapper">
        <div className="loading-spinner"></div>
        <p style={{ marginTop: '16px' }}>Loading your appointments...</p>
      </div>
    );
  }

  return (
    <div>
      <h1>My Service Appointments</h1>
      <p style={{ color: '#888', marginBottom: '24px' }}>Schedule a service or repair appointment with our expert mechanics.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* Form Section */}
        <div className="large-card">
          <h3>Book New Appointment</h3>
          
          {message.text && (
            <div style={{ 
              padding: '10px', 
              borderRadius: '4px', 
              marginBottom: '15px',
              background: message.type === 'success' ? 'rgba(46, 160, 67, 0.15)' : 'rgba(248, 81, 73, 0.15)',
              color: message.type === 'success' ? '#3fb950' : '#f85149',
              border: `1px solid ${message.type === 'success' ? '#2ea043' : '#f85149'}`
            }}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#888' }}>Service Type *</label>
              <select 
                name="serviceType"
                required
                value={formData.serviceType} 
                onChange={handleInputChange}
                style={{ width: '100%', padding: '10px', background: '#0d1117', border: '1px solid #2f363d', borderRadius: '6px', color: '#fff' }}
              >
                <option value="">Select a service</option>
                <option value="General Inspection">General Inspection</option>
                <option value="Oil Change">Oil Change</option>
                <option value="Brake Service">Brake Service</option>
                <option value="Tire Rotation/Alignment">Tire Rotation/Alignment</option>
                <option value="Part Installation">Part Installation</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#888' }}>Select Vehicle (Optional)</label>
              <select 
                name="vehicleId"
                value={formData.vehicleId} 
                onChange={handleInputChange}
                style={{ width: '100%', padding: '10px', background: '#0d1117', border: '1px solid #2f363d', borderRadius: '6px', color: '#fff' }}
              >
                <option value="">-- No specific vehicle --</option>
                {myVehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.displayName || `${v.make} ${v.model}`}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#888' }}>Available Time Slots *</label>
              <select 
                name="appointmentDate"
                required
                value={formData.appointmentDate} 
                onChange={handleInputChange}
                style={{ width: '100%', padding: '10px', background: '#0d1117', border: '1px solid #2f363d', borderRadius: '6px', color: '#fff' }}
              >
                <option value="">Select a slot</option>
                {slots.map(slot => (
                  <option key={slot.dateTime} value={slot.dateTime}>
                    {slot.display} ({slot.available} left)
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#888' }}>Notes</label>
              <textarea 
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Describe any specific issues..."
                style={{ width: '100%', padding: '10px', background: '#0d1117', border: '1px solid #2f363d', borderRadius: '6px', color: '#fff', minHeight: '100px' }}
              />
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              style={{ width: '100%' }}
              disabled={submitting}
            >
              {submitting ? 'Booking...' : 'Confirm Booking'}
            </button>
          </form>
        </div>

        {/* List Section */}
        <div className="large-card">
          <h3>My Appointments</h3>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #222' }}>
                  <th style={{ textAlign: 'left', padding: '10px', color: '#888' }}>Service</th>
                  <th style={{ textAlign: 'left', padding: '10px', color: '#888' }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '10px', color: '#888' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                      No appointments found.
                    </td>
                  </tr>
                ) : (
                  appointments.map((a) => (
                    <tr key={a.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                      <td style={{ padding: '10px' }}>
                        <div>{a.serviceType}</div>
                        {a.vehicleName && <div style={{ fontSize: '12px', color: '#666' }}>{a.vehicleName}</div>}
                      </td>
                      <td style={{ padding: '10px', color: '#888' }}>
                        {new Date(a.appointmentDate).toLocaleString()}
                      </td>
                      <td style={{ padding: '10px' }}>
                        <span style={{ 
                          padding: '3px 8px', 
                          borderRadius: '12px', 
                          fontSize: '11px', 
                          fontWeight: 'bold',
                          color: '#fff',
                          background: getStatusColor(a.status)
                        }}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerAppointmentsPage;
