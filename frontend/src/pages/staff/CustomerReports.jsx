import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './CustomerReports.css';

const CustomerReports = () => {
  const [reports, setReports] = useState({ regulars: [], highSpenders: [], pendingCredits: [] });
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

  const exportToPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Customer Analytics Report", 14, 15);

    // Top Regulars Table
    doc.setFontSize(12);
    doc.text("Top Regulars", 14, 25);
    const regularsData = reports.regulars.map((c, i) => [i + 1, c.fullName, c.email, c.orderCount]);
    doc.autoTable({
      startY: 30,
      head: [['Rank', 'Customer Name', 'Email', 'Total Orders']],
      body: regularsData,
    });

    // High Spenders Table
    let finalY = doc.lastAutoTable.finalY || 30;
    doc.text("High Spenders", 14, finalY + 15);
    const spendersData = reports.highSpenders.map((c, i) => [i + 1, c.fullName, c.email, formatCurrency(c.totalSpent)]);
    doc.autoTable({
      startY: finalY + 20,
      head: [['Rank', 'Customer Name', 'Email', 'Total Spent']],
      body: spendersData,
    });

    // Pending Credits Table
    finalY = doc.lastAutoTable.finalY || finalY + 20;
    doc.text("Pending Credits", 14, finalY + 15);
    const creditsData = (reports.pendingCredits || []).map((c, i) => [i + 1, c.fullName, c.email, formatCurrency(c.pendingAmount)]);
    doc.autoTable({
      startY: finalY + 20,
      head: [['Rank', 'Customer Name', 'Email', 'Pending Amount']],
      body: creditsData,
    });

    doc.save("Customer_Reports.pdf");
  };

  return (
    <div className="reports-container">
      <div className="reports-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Customer Reports</h2>
          <p>View analytics and key metrics for our customer base.</p>
        </div>
        <button onClick={exportToPDF} className="btn-primary" style={{ background: '#e04f5f', color: '#fff', border: 'none' }}>
          📄 Export to PDF
        </button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--admin-text-muted)' }}>Loading reports...</p>
      ) : (
        <div className="reports-grid">
          {/* Top Regulars */}
          <div className="report-card">
            <div className="report-card-header">
              <h3>Top Regulars</h3>
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
              <h3>High Spenders</h3>
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

          {/* Pending Credits */}
          <div className="report-card">
            <div className="report-card-header">
              <h3>⚠️ Pending Credits</h3>
              <p>Customers with unpaid or pending credit balances.</p>
            </div>
            <div className="report-table-container">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Customer Name</th>
                    <th>Email</th>
                    <th>Pending Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {!reports.pendingCredits || reports.pendingCredits.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center' }}>No pending credits found</td>
                    </tr>
                  ) : (
                    reports.pendingCredits.map((c, index) => (
                      <tr key={`credit-${c.id}`}>
                        <td>#{index + 1}</td>
                        <td className="customer-name">{c.fullName}</td>
                        <td className="text-muted">{c.email}</td>
                        <td className="highlight-value" style={{ color: '#e04f5f' }}>{formatCurrency(c.pendingAmount)}</td>
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
