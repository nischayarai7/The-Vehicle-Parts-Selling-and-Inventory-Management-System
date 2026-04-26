import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import './CustomerDetails.css';

const CustomerDetails = () => {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomerDetails();
  }, [id]);

  const fetchCustomerDetails = async () => {
    try {
      const res = await api.getStaffCustomerDetails(id);
      setCustomer(res);
    } catch (err) {
      console.error('Failed to fetch customer details', err);
    } finally {
      setLoading(false);
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
        <button className="edit-btn">
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
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--admin-text-muted)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Full Name</span>
              <span className="info-value">{customer.fullName}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Email Address</span>
              <span className="info-value">{customer.email}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Phone Number</span>
              <span className="info-value">{customer.phoneNumber || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Joined Date</span>
              <span className="info-value">{new Date(customer.createdAt).toLocaleDateString()}</span>
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

    </div>
  );
};

export default CustomerDetails;
