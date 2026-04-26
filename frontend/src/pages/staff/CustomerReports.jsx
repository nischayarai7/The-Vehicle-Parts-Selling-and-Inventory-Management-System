import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import './CustomerReports.css';

const CustomerReports = () => {
  const [reports, setReports] = useState({ regulars: [], highSpenders: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await api.getStaffCustomerReports();
      setReports(res);
    } catch (err) {
      console.error('Failed to fetch customer reports', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h2>📊 Customer Reports</h2>
        <p>View analytics and key metrics for our customer base.</p>
      </div>

      {loading ? (
        <p style={{ color: 'var(--admin-text-muted)' }}>Loading reports...</p>
      ) : (
        <div className="reports-grid">
          {/* Top Regulars */}
          <div className="report-card">
            <div className="report-card-header">
              <h3>🏆 Top Regulars</h3>
              <p>Customers with the highest number of orders.</p>
            </div>
            <div className="report-table-container">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Customer Name</th>
                    <th>Email</th>
                    <th>Total Orders</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.regulars.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center' }}>No data available</td>
                    </tr>
                  ) : (
                    reports.regulars.map((c, index) => (
                      <tr key={`reg-${c.id}`}>
                        <td>#{index + 1}</td>
                        <td className="customer-name">{c.fullName}</td>
                        <td className="text-muted">{c.email}</td>
                        <td className="highlight-value">{c.orderCount}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* High Spenders */}
          <div className="report-card">
            <div className="report-card-header">
              <h3>💎 High Spenders</h3>
              <p>Customers ranked by total lifetime value.</p>
            </div>
            <div className="report-table-container">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Customer Name</th>
                    <th>Email</th>
                    <th>Total Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.highSpenders.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center' }}>No data available</td>
                    </tr>
                  ) : (
                    reports.highSpenders.map((c, index) => (
                      <tr key={`high-${c.id}`}>
                        <td>#{index + 1}</td>
                        <td className="customer-name">{c.fullName}</td>
                        <td className="text-muted">{c.email}</td>
                        <td className="highlight-value">{formatCurrency(c.totalSpent)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerReports;
