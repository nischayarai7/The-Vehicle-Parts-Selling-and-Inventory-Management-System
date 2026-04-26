import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import './ProfileSettings.css'; // Reuse some settings styling
import './AppointmentsPage.css';

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [myVehicles, setMyVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    vehicleId: '',
    serviceType: '',
    appointmentDate: '',
    notes: ''
  });

  useEffect(() => {
    fetchAppointments();
    fetchMyVehicles();
  }, []);

  const fetchAppointments = async () => {
    try {
      const data = await api.getMyAppointments();
      setAppointments(data);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    }
  };

  const fetchMyVehicles = async () => {
    try {
      const data = await api.getMyVehicles();
      setMyVehicles(data);
    } catch (err) {
      console.error('Failed to load vehicles:', err);
    }
  };

  const handleBook = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.bookAppointment({
        vehicleId: formData.vehicleId ? parseInt(formData.vehicleId) : null,
        serviceType: formData.serviceType,
        appointmentDate: new Date(formData.appointmentDate).toISOString(),
        notes: formData.notes
      });
      setShowModal(false);
      setFormData({ vehicleId: '', serviceType: '', appointmentDate: '', notes: '' });
      fetchAppointments();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
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

  return (
    <div className="container appointments-page" style={{ padding: '40px 20px', minHeight: '60vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2>My Service Appointments</h2>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Book Appointment
        </button>
      </div>

      <div className="appointments-list">
        {appointments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', background: '#f9f9f9', borderRadius: '8px' }}>
            <p>You have no appointments booked.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {appointments.map(app => (
              <div key={app.id} className="appointment-card" style={{ padding: '20px', background: '#fff', border: '1px solid #eee', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>{app.serviceType}</h3>
                    <p style={{ margin: '5px 0', color: '#666' }}>
                      <strong>Date:</strong> {new Date(app.appointmentDate).toLocaleString()}
                    </p>
                    {app.vehicleName && (
                      <p style={{ margin: '5px 0', color: '#666' }}>
                        <strong>Vehicle:</strong> {app.vehicleName}
                      </p>
                    )}
                    {app.notes && (
                      <p style={{ margin: '5px 0', color: '#666', fontStyle: 'italic' }}>
                        Notes: {app.notes}
                      </p>
                    )}
                  </div>
                  <div style={{ 
                    padding: '5px 12px', 
                    borderRadius: '20px', 
                    fontSize: '12px', 
                    fontWeight: 'bold',
                    color: '#fff',
                    background: getStatusColor(app.status)
                  }}>
                    {app.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="modal-content" style={{ background: '#fff', padding: '30px', borderRadius: '8px', width: '100%', maxWidth: '500px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Book an Appointment</h3>
            <form onSubmit={handleBook}>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Service Type *</label>
                <select 
                  required
                  value={formData.serviceType} 
                  onChange={e => setFormData({...formData, serviceType: e.target.value})}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
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

              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Select Vehicle (Optional)</label>
                <select 
                  value={formData.vehicleId} 
                  onChange={e => setFormData({...formData, vehicleId: e.target.value})}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                  <option value="">-- No specific vehicle / Not in Garage --</option>
                  {myVehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.displayName}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Date & Time *</label>
                <input 
                  type="datetime-local" 
                  required
                  value={formData.appointmentDate}
                  onChange={e => setFormData({...formData, appointmentDate: e.target.value})}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Notes</label>
                <textarea 
                  rows="3"
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  placeholder="Describe any specific issues..."
                  style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentsPage;
