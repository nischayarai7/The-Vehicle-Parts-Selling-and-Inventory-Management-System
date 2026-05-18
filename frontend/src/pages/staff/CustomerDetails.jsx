import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import './CustomerDetails.css';

const CustomerDetails = () => {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ fullName: '', email: '', phoneNumber: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCustomerDetails();
  }, [id]);

  const fetchCustomerDetails = async () => {
    try {
      const res = await api.getStaffCustomerDetails(id);
      setCustomer(res);
      setEditData({
        fullName: res.fullName,
        email: res.email,
        phoneNumber: res.phoneNumber || ''
      });
    } catch (err) {
      console.error('Failed to fetch customer details', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.updateStaffCustomer(id, editData);
      await fetchCustomerDetails(); // Refresh
      setIsEditing(false);
    } catch (err) {
      alert('Failed to update customer: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="admin-dashboard"><p>Loading details...</p></div>;
  if (!customer) return <div className="admin-dashboard"><p>Customer not found.</p></div>;

  return (
    <div className="customer-details-container">
      <Link to="/staff/customers" className="back-link">&larr; Back to Directory</Link>

      <div className="header-section">
        <div className="header-title">
          <svg className="user-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <h2>Customer Details</h2>
        </div>
        <button className="edit-btn" onClick={() => setIsEditing(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
          Edit Details
        </button>
      </div>

      <div className="details-section">
        <h3 className="section-title">Personal Information</h3>
        <div className="details-card personal-card">
          <div className="profile-placeholder">
            <span className="profile-initials">
              {customer.fullName ? customer.fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '?'}
            </span>
          </div>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">
                <svg style={{ width: '12px', height: '12px', color: 'var(--admin-primary, #e04f5f)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Full Name
              </span>
              <span className="info-value">{customer.fullName}</span>
            </div>
            <div className="info-item">
              <span className="info-label">
                <svg style={{ width: '12px', height: '12px', color: 'var(--admin-primary, #e04f5f)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                Email Address
              </span>
              <span className="info-value">{customer.email}</span>
            </div>
            <div className="info-item">
              <span className="info-label">
                <svg style={{ width: '12px', height: '12px', color: 'var(--admin-primary, #e04f5f)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                Phone Number
              </span>
              <span className="info-value">{customer.phoneNumber || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">
                <svg style={{ width: '12px', height: '12px', color: 'var(--admin-primary, #e04f5f)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Joined Date
              </span>
              <span className="info-value">{new Date(customer.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="details-section">
        <h3 className="section-title">Linked Vehicles</h3>
        <div className="details-card list-card">
          {customer.vehicles && customer.vehicles.length > 0 ? (
            <div className="vehicles-grid">
              {customer.vehicles.map(v => (
                <div key={v.id} className="vehicle-item">
                  <div className="vehicle-info">
                    <span className="info-label">Vehicle Name</span>
                    <span className="info-value">{v.vehicleName}</span>
                  </div>
                  <div className="vehicle-info">
                    <span className="info-label">License Plate</span>
                    <span className="info-value">{v.licensePlate || 'N/A'}</span>
                  </div>
                  <div className="vehicle-info">
                    <span className="info-label">Color</span>
                    <span className="info-value">{v.color || 'N/A'}</span>
                  </div>
                  <div className="vehicle-info">
                    <span className="info-label">VIN</span>
                    <span className="info-value">{v.vin || 'N/A'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">No vehicles linked.</p>
          )}
        </div>
      </div>

      <div className="details-section">
        <h3 className="section-title">Order History</h3>
        <div className="details-card table-card">
          {customer.recentOrders && customer.recentOrders.length > 0 ? (
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {customer.recentOrders.map(o => (
                  <tr key={o.id}>
                    <td>{o.orderNumber}</td>
                    <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge ${o.status.toLowerCase()}`}>
                        {o.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold' }}>
                      ${o.totalAmount.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="empty-state">No order history found.</p>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Edit Customer Details</h3>
            <div className="form-group">
              <label>Full Name</label>
              <input 
                type="text" 
                name="fullName" 
                value={editData.fullName} 
                onChange={handleEditChange} 
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                name="email" 
                value={editData.email} 
                onChange={handleEditChange} 
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input 
                type="text" 
                name="phoneNumber" 
                value={editData.phoneNumber} 
                onChange={handleEditChange} 
                className="form-input"
              />
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setIsEditing(false)} disabled={isSaving}>Cancel</button>
              <button className="btn-save" onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDetails;
