import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';

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
    <div>
      <Link to="/staff/customers" style={{ display: 'inline-block', marginBottom: '20px', color: 'var(--admin-text-muted)' }}>&larr; Back to Directory</Link>
      <h2 style={{ marginBottom: '20px' }}>Customer Profile: {customer.fullName}</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="large-card">
            <h3 style={{ marginBottom: '15px', color: 'var(--admin-text-muted)' }}>Details</h3>
            <p><strong>Email:</strong> <span style={{ color: 'var(--admin-text-muted)' }}>{customer.email}</span></p>
            <p><strong>Joined:</strong> <span style={{ color: 'var(--admin-text-muted)' }}>{new Date(customer.createdAt).toLocaleDateString()}</span></p>
          </div>

          <div className="large-card">
            <h3 style={{ marginBottom: '15px', color: 'var(--admin-text-muted)' }}>Linked Vehicles</h3>
            {customer.vehicles && customer.vehicles.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {customer.vehicles.map(v => (
                  <div key={v.id} style={{ border: '1px solid var(--admin-border)', padding: '15px', borderRadius: '8px', background: '#1c2128' }}>
                    <strong>{v.vehicleName}</strong>
                    <div style={{ color: 'var(--admin-text-muted)', fontSize: '13px', marginTop: '5px' }}>
                      Plate: {v.licensePlate || 'N/A'} | Color: {v.color || 'N/A'} <br/>
                      VIN: {v.vin || 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--admin-text-muted)' }}>No vehicles linked.</p>
            )}
          </div>
        </div>

        <div>
          <div className="large-card">
            <h3 style={{ marginBottom: '15px', color: 'var(--admin-text-muted)' }}>Order History</h3>
            {customer.recentOrders && customer.recentOrders.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--admin-border)' }}>
                    <th style={{ padding: '10px 0', color: 'var(--admin-text-muted)', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase' }}>Order #</th>
                    <th style={{ padding: '10px 0', color: 'var(--admin-text-muted)', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase' }}>Date</th>
                    <th style={{ padding: '10px 0', color: 'var(--admin-text-muted)', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase' }}>Status</th>
                    <th style={{ padding: '10px 0', color: 'var(--admin-text-muted)', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {customer.recentOrders.map(o => (
                    <tr key={o.id} style={{ borderBottom: '1px solid var(--admin-border)' }}>
                      <td style={{ padding: '15px 0' }}>{o.orderNumber}</td>
                      <td style={{ padding: '15px 0', color: 'var(--admin-text-muted)' }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '15px 0' }}><span style={{ color: 'var(--success)' }}>{o.status}</span></td>
                      <td style={{ padding: '15px 0', textAlign: 'right', fontWeight: 'bold' }}>${o.totalAmount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ color: 'var(--admin-text-muted)' }}>No order history found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetails;
