import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './CustomerReports.css';

const CustomerReports = () => {
  const [reports, setReports] = useState({ regulars: [], highSpenders: [], pendingCredits: [] });
  const [loading, setLoading] = useState(true);

  // Overdue Reminders & Drawer State
  const [selectedDebtor, setSelectedDebtor] = useState(null);
  const [debtorCredits, setDebtorCredits] = useState([]);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [sendingId, setSendingId] = useState(null);
  const [sendingBulk, setSendingBulk] = useState(false);
  
  // Toast Notification State
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

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
      currency: 'NPR',
      minimumFractionDigits: 2
    }).format(amount).replace('NPR', 'Rs.');
  };

  const handleViewDebtorDetails = async (debtor) => {
    setSelectedDebtor(debtor);
    setDrawerLoading(true);
    try {
      const res = await api.getPendingCredits();
      const allCredits = res.data || [];
      // Filter credits belonging to this user that are still pending
      const filtered = allCredits.filter(c => c.userId === debtor.id && c.status === 'Pending');
      setDebtorCredits(filtered);
    } catch (err) {
      console.error('Failed to fetch detailed credit records', err);
      showToast('Failed to retrieve individual credit lines.', 'error');
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleSendReminder = async (creditId) => {
    setSendingId(creditId);
    try {
      await api.sendOverdueCreditReminder(creditId);
      showToast('Email statement alert dispatched successfully!');
      if (selectedDebtor) {
        handleViewDebtorDetails(selectedDebtor);
      }
    } catch (err) {
      console.error('Failed to dispatch credit reminder', err);
      showToast(err.message || 'Failed to dispatch email reminder.', 'error');
    } finally {
      setSendingId(null);
    }
  };

  const handleSendBulkReminders = async () => {
    setSendingBulk(true);
    try {
      const res = await api.sendAllOverdueCreditReminders();
      showToast(res.message || 'Overdue balances bulk dispatched!');
      fetchReports();
    } catch (err) {
      console.error('Failed to dispatch bulk overdue reminders', err);
      showToast(err.message || 'Failed to send bulk reminders.', 'error');
    } finally {
      setSendingBulk(false);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Customer Analytics Report", 14, 15);

    // Top Regulars Table
    doc.setFontSize(12);
    doc.text("Top Regulars", 14, 25);
    const regularsData = reports.regulars.map((c, i) => [i + 1, c.fullName, c.email, c.orderCount]);
    autoTable(doc, {
      startY: 30,
      head: [['Rank', 'Customer Name', 'Email', 'Total Orders']],
      body: regularsData,
    });

    // High Spenders Table
    let finalY = doc.lastAutoTable?.finalY || 30;
    doc.text("High Spenders", 14, finalY + 15);
    const spendersData = reports.highSpenders.map((c, i) => [i + 1, c.fullName, c.email, formatCurrency(c.totalSpent)]);
    autoTable(doc, {
      startY: finalY + 20,
      head: [['Rank', 'Customer Name', 'Email', 'Total Spent']],
      body: spendersData,
    });

    // Pending Credits Table
    finalY = doc.lastAutoTable?.finalY || finalY + 20;
    doc.text("Pending Credits", 14, finalY + 15);
    const creditsData = (reports.pendingCredits || []).map((c, i) => [i + 1, c.fullName, c.email, formatCurrency(c.pendingAmount)]);
    autoTable(doc, {
      startY: finalY + 20,
      head: [['Rank', 'Customer Name', 'Email', 'Pending Amount']],
      body: creditsData,
    });

    doc.save("Customer_Reports.pdf");
  };

  return (
    <div className="reports-container">
      {/* Toast alerts */}
      {toast && (
        <div className={`admin-toast ${toast.type}`}>
          <div className="toast-content">
            {toast.type === 'error' ? '⚠️' : '✅'} {toast.message}
          </div>
        </div>
      )}

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
            <div className="report-card-header flex-header">
              <div>
                <h3>⚠️ Pending Credits</h3>
                <p>Customers with unpaid or pending credit balances.</p>
              </div>
              <button 
                className="btn-action-email flex-btn" 
                onClick={handleSendBulkReminders}
                disabled={sendingBulk || !reports.pendingCredits || reports.pendingCredits.length === 0}
                style={{ fontSize: '11px', padding: '6px 12px' }}
                title="Send warning statement emails to all customer accounts overdue for more than a month"
              >
                {sendingBulk ? (
                  <span className="mini-spinner"></span>
                ) : (
                  <>
                    <svg className="btn-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    Alert All Overdue
                  </>
                )}
              </button>
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
                      <tr 
                        key={`credit-${c.id}`} 
                        className="interactive-row" 
                        onClick={() => handleViewDebtorDetails(c)}
                        title="Click to view detailed outstanding statement history & notify"
                      >
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

      {/* Credit History slide-out drawer */}
      {selectedDebtor && (
        <div className="drawer-overlay" onClick={() => setSelectedDebtor(null)}>
          <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <h3>Credit Account: {selectedDebtor.fullName}</h3>
                <p className="drawer-subtitle">{selectedDebtor.email}</p>
              </div>
              <button className="drawer-close-btn" onClick={() => setSelectedDebtor(null)}>✕</button>
            </div>

            <div className="drawer-body">
              {drawerLoading ? (
                <div className="drawer-loading">
                  <div className="loading-spinner"></div>
                  <p>Auditing customer balance statements...</p>
                </div>
              ) : (
                <div className="drawer-lines-list">
                  <div className="drawer-summary-box">
                    <span>Total Outstanding Debt</span>
                    <h4 className="total-debt-amount">
                      {formatCurrency(selectedDebtor.pendingAmount)}
                    </h4>
                  </div>

                  <h4 className="drawer-section-title">Active Credit Lines</h4>
                  
                  {debtorCredits.length === 0 ? (
                    <p style={{ color: 'var(--admin-text-muted)', fontSize: '13px' }}>No pending credits registered.</p>
                  ) : (
                    debtorCredits.map((c) => {
                      const days = Math.floor((new Date() - new Date(c.createdAt)) / (1000 * 60 * 60 * 24));
                      const isOverdue = days >= 30;

                      return (
                        <div key={c.id} className="credit-line-card">
                          <div className="credit-line-header">
                            <span className="credit-date">
                              {new Date(c.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                            {isOverdue ? (
                              <span className="due-badge overdue">⚠️ Overdue ({days}d)</span>
                            ) : (
                              <span className="due-badge safe">{days}d pending</span>
                            )}
                          </div>
                          
                          <p className="credit-desc">{c.description || 'General Account Credit balance'}</p>
                          
                          <div className="credit-line-footer">
                            <span className="credit-amount">{formatCurrency(c.amount)}</span>
                            <button 
                              className="btn-line-reminder flex-btn"
                              onClick={() => handleSendReminder(c.id)}
                              disabled={sendingId === c.id}
                            >
                              {sendingId === c.id ? (
                                <span className="mini-spinner"></span>
                              ) : (
                                <>
                                  <svg style={{ width: '12px', height: '12px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                                  Alert Customer
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
            
            <div className="drawer-footer">
              <button className="admin-btn-outline" style={{ width: '100%' }} onClick={() => setSelectedDebtor(null)}>
                Close Audit Statement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerReports;
