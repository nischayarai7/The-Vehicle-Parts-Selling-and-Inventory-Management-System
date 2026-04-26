import React from 'react';
import { Link } from 'react-router-dom';

const StaffDashboard = () => {
  return (
    <div>
      <div className="dashboard-grid">
        <div className="stat-card">
          <h5>TODAY'S SALES</h5>
          <div className="value">$0.00</div>
          <div className="trend up"><span>↑</span> 0% vs last week</div>
        </div>
        <div className="stat-card">
          <h5>CUSTOMERS SERVED</h5>
          <div className="value">0</div>
          <div className="trend up"><span>↑</span> 0% vs last week</div>
        </div>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        <div className="large-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h3>🛒 Point of Sale</h3>
          <p style={{ color: 'var(--admin-text-muted)' }}>Create new sales and invoices for customers.</p>
          <Link to="/staff/pos" className="btn-primary" style={{ textAlign: 'center', marginTop: 'auto' }}>Open POS</Link>
        </div>

        <div className="large-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h3>👥 Customer Directory</h3>
          <p style={{ color: 'var(--admin-text-muted)' }}>View customer details, vehicles, and history.</p>
          <Link to="/staff/customers" className="btn-primary" style={{ textAlign: 'center', marginTop: 'auto', background: '#30363d', color: 'white' }}>View Customers</Link>
        </div>

        <div className="large-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h3>➕ Register Customer</h3>
          <p style={{ color: 'var(--admin-text-muted)' }}>Add new customers with their vehicle information.</p>
          <Link to="/staff/register-customer" className="btn-primary" style={{ textAlign: 'center', marginTop: 'auto', background: '#30363d', color: 'white' }}>Register Now</Link>
        </div>

        <div className="large-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h3>📊 Customer Reports</h3>
          <p style={{ color: 'var(--admin-text-muted)' }}>Generate analytics on regulars and spenders.</p>
          <Link to="/staff/reports" className="btn-primary" style={{ textAlign: 'center', marginTop: 'auto', background: '#30363d', color: 'white' }}>View Reports</Link>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
