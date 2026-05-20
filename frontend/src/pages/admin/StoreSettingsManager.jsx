import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

const StoreSettingsManager = () => {
  const [formData, setFormData] = useState({
    address: '',
    phone: '',
    email: '',
    businessHours: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await api.getStoreSettings();
      setFormData({
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || '',
        businessHours: data.businessHours || ''
      });
    } catch (err) {
      setError(err.message || 'Failed to load store settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.updateStoreSettings(formData);
      setSuccess(response.message || 'Store settings updated successfully');
    } catch (err) {
      setError(err.message || 'Failed to update store settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="manager-container">
        <h2>Store Settings</h2>
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="manager-container" style={{ maxWidth: '800px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--admin-text-main)' }}>Store Information</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--admin-text-muted)', fontSize: '14px' }}>
            Manage the contact and location details displayed on the public Contact page.
          </p>
        </div>
      </div>

      {success && (
        <div style={{ background: 'rgba(46, 160, 67, 0.15)', border: '1px solid #2ea043', borderRadius: '4px', padding: '12px', marginBottom: '20px', color: '#3fb950', fontSize: '14px' }}>
          {success}
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(248, 81, 73, 0.15)', border: '1px solid #f85149', borderRadius: '4px', padding: '12px', marginBottom: '20px', color: '#ff7b72', fontSize: '14px' }}>
          {error}
        </div>
      )}

      <div style={{ background: 'var(--admin-bg-secondary)', border: '1px solid var(--admin-border)', borderRadius: '8px', padding: '24px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--admin-text-main)' }}>Store Address</label>
            <textarea 
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows="3"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--admin-border)', background: 'var(--admin-bg-main)', color: 'var(--admin-text-main)', resize: 'vertical' }}
              placeholder="e.g. 123 Auto Parts Blvd, Motor City, MI 48201"
              required
            />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--admin-text-main)' }}>Contact Phone</label>
              <input 
                type="text" 
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--admin-border)', background: 'var(--admin-bg-main)', color: 'var(--admin-text-main)' }}
                placeholder="e.g. +1 (555) 123-4567"
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--admin-text-main)' }}>Contact Email</label>
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleChange}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--admin-border)', background: 'var(--admin-bg-main)', color: 'var(--admin-text-main)' }}
                placeholder="e.g. contact@6ix7even.com"
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--admin-text-main)' }}>Business Hours</label>
            <textarea 
              name="businessHours"
              value={formData.businessHours}
              onChange={handleChange}
              rows="3"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--admin-border)', background: 'var(--admin-bg-main)', color: 'var(--admin-text-main)', resize: 'vertical' }}
              placeholder="e.g. Monday - Friday: 8AM - 6PM\nSaturday: 9AM - 4PM"
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button 
              type="submit" 
              disabled={saving}
              style={{
                background: 'var(--admin-accent)',
                color: 'white',
                border: 'none',
                padding: '10px 24px',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {saving ? (
                <>
                  <svg className="spinner" viewBox="0 0 50 50" style={{ width: '16px', height: '16px' }}>
                    <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                  </svg>
                  Saving...
                </>
              ) : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StoreSettingsManager;
