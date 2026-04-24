import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ parts: 0, categories: 0, lowStock: 0 });
  const [recentParts, setRecentParts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const parts = await api.getAllParts();
        const categories = await api.getCategories();
        
        setStats({
          parts: parts.length,
          categories: categories.length,
          lowStock: parts.filter(p => p.isLowStock).length
        });

        setRecentParts(parts.slice(0, 3));
      } catch (error) {
        console.error("Failed to load data", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="dashboard-content">
      {/* Stats Row */}
      <div className="dashboard-grid">
        <div className="stat-card">
          <h5>Total Parts</h5>
          <div className="value">{stats.parts}</div>
          <div className="trend up">▲ 12% vs last month</div>
        </div>
        <div className="stat-card">
          <h5>Total Categories</h5>
          <div className="value">{stats.categories}</div>
          <div className="trend up">▲ 2% vs last month</div>
        </div>
        <div className="stat-card">
          <h5>Low Stock Items</h5>
          <div className="value" style={{ color: 'var(--admin-accent)' }}>{stats.lowStock}</div>
          <div className="trend down">▼ 5% improvement</div>
        </div>
        <div className="stat-card">
          <h5>System Health</h5>
          <div className="value">99.9%</div>
          <div className="trend up">▲ Stable</div>
        </div>
      </div>

      {/* Middle Row: Analytics & Smaller Widgets */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div className="large-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ marginBottom: '10px' }}>Inventory Overview</h3>
            <p style={{ color: 'var(--admin-text-muted)', fontSize: '14px' }}>Real-time stock distribution across categories.</p>
            <div style={{ marginTop: '20px', display: 'flex', gap: '30px' }}>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>$136,755.77</div>
                <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Total Inventory Value</div>
              </div>
              <div>
                <div style={{ fontSize: '20px', fontWeight: 'bold' }}>1,204</div>
                <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>Items in Transit</div>
              </div>
            </div>
          </div>
          {/* Donut Chart Placeholder */}
          <div style={{ width: '150px', height: '150px', borderRadius: '50%', border: '15px solid var(--admin-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '20px', fontWeight: 'bold' }}>82%</span>
          </div>
        </div>

        <div className="large-card" style={{ background: 'linear-gradient(135deg, var(--admin-accent), #9e1a1a)', color: 'white' }}>
          <h4>Premium Plan</h4>
          <p style={{ fontSize: '13px', margin: '10px 0 20px 0', opacity: 0.8 }}>Upgrade your dashboard to unlock advanced AI forecasting.</p>
          <div style={{ fontSize: '32px', fontWeight: '800', marginBottom: '20px' }}>$30 <span style={{ fontSize: '14px', fontWeight: 'normal' }}>/ mo</span></div>
          <button style={{ background: 'white', color: 'var(--admin-accent)', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Get Started</button>
        </div>
      </div>

      {/* Bottom Row: Table */}
      <div className="large-card">
        <h3 style={{ marginBottom: '20px' }}>Recent Parts Added</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--admin-text-muted)', fontSize: '12px', borderBottom: '1px solid var(--admin-border)' }}>
              <th style={{ padding: '10px 0' }}>Part Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {recentParts.map(part => (
              <tr key={part.id} style={{ fontSize: '14px', borderBottom: '1px solid var(--admin-border)' }}>
                <td style={{ padding: '15px 0', fontWeight: '500' }}>{part.name}</td>
                <td style={{ color: 'var(--admin-text-muted)' }}>{part.categoryName}</td>
                <td>Rs. {part.price}</td>
                <td>{part.stockQuantity}</td>
                <td style={{ textAlign: 'right' }}>
                  <button style={{ color: 'var(--admin-accent)', background: 'none', border: 'none', cursor: 'pointer' }}>Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
