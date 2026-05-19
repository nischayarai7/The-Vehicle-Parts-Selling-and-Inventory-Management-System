import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import '../ShopPage.css'; // Reusing shop page styles for consistency

const PartRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    partName: '',
    partNumber: '',
    vehicleDetails: '',
    notes: ''
  });

  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      const data = await api.getMyPartRequests();
      setRequests(data);
    } catch (err) {
      console.error('Failed to load part requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.partName) {
      setMessage({ text: 'Part Name is required.', type: 'error' });
      return;
    }

    try {
      setSubmitting(true);
      await api.createPartRequest(formData);
      setMessage({ text: 'Part request submitted successfully!', type: 'success' });
      setFormData({ partName: '', partNumber: '', vehicleDetails: '', notes: '' });
      fetchMyRequests(); // Refresh list
    } catch (err) {
      console.error('Failed to submit part request:', err);
      setMessage({ text: 'Failed to submit request. Please try again.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="spinner-wrapper">
        <div className="loading-spinner"></div>
        <p style={{ marginTop: '16px' }}>Loading your requests...</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Request Unavailable Parts</h1>
      <p style={{ color: '#888', marginBottom: '24px' }}>Can't find the part you need in our catalog? Fill out the form below and we will try to source it for you.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* Form Section */}
        <div className="large-card">
          <h3>Submit New Request</h3>
          
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
              <label style={{ display: 'block', marginBottom: '5px', color: '#888' }}>Part Name *</label>
              <input
                type="text"
                name="partName"
                value={formData.partName}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '10px', background: '#0d1117', border: '1px solid #2f363d', borderRadius: '6px', color: '#fff' }}
                placeholder="e.g. Brake Pads"
                required
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#888' }}>Part Number (Optional)</label>
              <input
                type="text"
                name="partNumber"
                value={formData.partNumber}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '10px', background: '#0d1117', border: '1px solid #2f363d', borderRadius: '6px', color: '#fff' }}
                placeholder="e.g. BP-12345"
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#888' }}>Vehicle Details</label>
              <input
                type="text"
                name="vehicleDetails"
                value={formData.vehicleDetails}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '10px', background: '#0d1117', border: '1px solid #2f363d', borderRadius: '6px', color: '#fff' }}
                placeholder="e.g. Toyota Corolla 2015"
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#888' }}>Notes / Description</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '10px', background: '#0d1117', border: '1px solid #2f363d', borderRadius: '6px', color: '#fff', minHeight: '100px' }}
                placeholder="Any specific brand or details..."
              />
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              style={{ width: '100%' }}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>

        {/* List Section */}
        <div className="large-card">
          <h3>My Requests</h3>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #222' }}>
                  <th style={{ textAlign: 'left', padding: '10px', color: '#888' }}>Part</th>
                  <th style={{ textAlign: 'left', padding: '10px', color: '#888' }}>Vehicle</th>
                  <th style={{ textAlign: 'left', padding: '10px', color: '#888' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                      No requests found.
                    </td>
                  </tr>
                ) : (
                  requests.map((r) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                      <td style={{ padding: '10px' }}>
                        <div>{r.partName}</div>
                        {r.partNumber && <div style={{ fontSize: '12px', color: '#666' }}>No: {r.partNumber}</div>}
                      </td>
                      <td style={{ padding: '10px', color: '#888' }}>{r.vehicleDetails || 'N/A'}</td>
                      <td style={{ padding: '10px' }}>
                        <span className={`status-pill ${r.status.toLowerCase()}`}>
                          {r.status}
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

export default PartRequestsPage;
