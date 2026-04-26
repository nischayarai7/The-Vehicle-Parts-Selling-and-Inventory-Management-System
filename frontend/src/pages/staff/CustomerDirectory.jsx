import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';

const CustomerDirectory = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await api.getStaffCustomers();
      setCustomers(res);
    } catch (err) {
      console.error('Failed to fetch customers', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Customer Directory</h2>
        <Link to="/staff/register-customer" className="btn-primary">➕ New Customer</Link>
      </div>

      {loading ? (
        <p style={{ color: 'var(--admin-text-muted)' }}>Loading...</p>
      ) : (
        <div className="large-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#1c2128', borderBottom: '1px solid var(--admin-border)' }}>
                <th style={{ padding: '15px', color: 'var(--admin-text-muted)', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase' }}>ID</th>
                <th style={{ padding: '15px', color: 'var(--admin-text-muted)', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase' }}>Name</th>
                <th style={{ padding: '15px', color: 'var(--admin-text-muted)', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase' }}>Email</th>
                <th style={{ padding: '15px', color: 'var(--admin-text-muted)', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase' }}>Joined Date</th>
                <th style={{ padding: '15px', color: 'var(--admin-text-muted)', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase' }}>Orders</th>
                <th style={{ padding: '15px', color: 'var(--admin-text-muted)', fontWeight: 600, fontSize: '13px', textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--admin-border)', transition: 'background 0.2s' }}>
                  <td style={{ padding: '15px', color: 'var(--admin-text-muted)' }}>#{c.id}</td>
                  <td style={{ padding: '15px', fontWeight: 500 }}>{c.fullName}</td>
                  <td style={{ padding: '15px', color: 'var(--admin-text-muted)' }}>{c.email}</td>
                  <td style={{ padding: '15px', color: 'var(--admin-text-muted)' }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '15px' }}>{c.totalOrders}</td>
                  <td style={{ padding: '15px' }}>
                    <Link to={`/staff/customers/${c.id}`} className="dashboard-btn" style={{ marginLeft: 0 }}>View Details</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CustomerDirectory;
