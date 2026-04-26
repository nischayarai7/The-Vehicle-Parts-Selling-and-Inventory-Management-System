import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

const RegisterCustomer = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    vehicleId: '',
    licensePlate: '',
    vin: '',
    color: ''
  });
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let timer;
    if (message) {
      timer = setTimeout(() => {
        setMessage('');
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await api.getAvailableVehicles();
        setVehicles(res);
      } catch (err) {
        console.error('Failed to fetch vehicles', err);
      }
    };
    fetchVehicles();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const payload = { ...formData };
      if (payload.vehicleId) {
        payload.vehicleId = parseInt(payload.vehicleId);
      } else {
        payload.vehicleId = null;
      }

      const res = await api.registerStaffCustomer(payload);
      setMessage(res.Message || 'Customer registered successfully.');
      setFormData({
        fullName: '', email: '', vehicleId: '', licensePlate: '', vin: '', color: ''
      });
    } catch (err) {
      setError(err.message || 'Failed to register customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="large-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '20px' }}>Register Customer</h2>
      {message && (
        <div style={{ 
          background: 'rgba(46, 204, 113, 0.1)', 
          color: '#2ecc71', 
          padding: '10px 15px', 
          borderRadius: '4px', 
          marginBottom: '15px',
          border: '1px solid rgba(46, 204, 113, 0.3)'
        }}>
          {message}
        </div>
      )}
      {error && <div style={{ color: 'var(--danger)', marginBottom: '15px' }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', color: 'var(--admin-text-muted)' }}>Full Name *</label>
          <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required 
                 style={{ width: '100%', padding: '10px', background: '#1c2128', border: '1px solid var(--admin-border)', color: 'white', borderRadius: '4px' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', color: 'var(--admin-text-muted)' }}>Email *</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required 
                 style={{ width: '100%', padding: '10px', background: '#1c2128', border: '1px solid var(--admin-border)', color: 'white', borderRadius: '4px' }} />
        </div>

        <h4 style={{ marginTop: '20px', color: 'var(--admin-text)' }}>Vehicle Details (Optional)</h4>
        
        <div>
          <label style={{ display: 'block', marginBottom: '5px', color: 'var(--admin-text-muted)' }}>Select Vehicle Model</label>
          <select 
            name="vehicleId" 
            value={formData.vehicleId} 
            onChange={handleChange}
            style={{ width: '100%', padding: '10px', background: '#1c2128', border: '1px solid var(--admin-border)', color: 'white', borderRadius: '4px' }}
          >
            <option value="">-- No Vehicle --</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', color: 'var(--admin-text-muted)' }}>License Plate</label>
          <input type="text" name="licensePlate" value={formData.licensePlate} onChange={handleChange} 
                 style={{ width: '100%', padding: '10px', background: '#1c2128', border: '1px solid var(--admin-border)', color: 'white', borderRadius: '4px' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', color: 'var(--admin-text-muted)' }}>VIN (Vehicle Identification Number)</label>
          <input type="text" name="vin" value={formData.vin} onChange={handleChange} 
                 style={{ width: '100%', padding: '10px', background: '#1c2128', border: '1px solid var(--admin-border)', color: 'white', borderRadius: '4px' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', color: 'var(--admin-text-muted)' }}>Color</label>
          <input type="text" name="color" value={formData.color} onChange={handleChange} 
                 style={{ width: '100%', padding: '10px', background: '#1c2128', border: '1px solid var(--admin-border)', color: 'white', borderRadius: '4px' }} />
        </div>

        <button type="submit" className="btn-primary" style={{ marginTop: '20px' }} disabled={loading}>
          {loading ? 'Registering...' : 'Register Customer'}
        </button>
      </form>
    </div>
  );
};

export default RegisterCustomer;
