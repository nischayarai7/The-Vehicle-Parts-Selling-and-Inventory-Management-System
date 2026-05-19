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

      <div className="reports-header-row">
        <div>
          <h2>Customer Analytics & Reports</h2>
          <p className="subtitle">Real-time behavior tracking, lifetime value stats, and credit lines.</p>
        </div>
        <button onClick={exportToPDF} className="btn-primary flex-btn">
          📄 Export Analytics to PDF
        </button>
      </div>

      {loading ? (
        <div className="orders-loading-box">
          <span className="mini-spinner"></span>
          <p>Loading analytics reports...</p>
        </div>
      ) : (
        <>
          {/* KPI Dashboard Stats Cards */}
          <div className="orders-kpi-grid" style={{ marginBottom: '24px' }}>
            <div className="stat-card">
              <div className="stat-icon-wrapper blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87m-4-12a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div className="stat-info">
                <div className="stat-value">{reports.regulars?.length || 0}</div>
                <div className="stat-label">Regular Clients</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper green">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="7"/><polyline points="8 21 12 17 16 21"/><line x1="12" y1="1" x2="12" y2="17"/></svg>
              </div>
              <div className="stat-info">
                <div className="stat-value">{reports.highSpenders?.filter(c => c.totalSpent > 10000).length || 0}</div>
                <div className="stat-label">V.I.P Clients (&gt;Rs.10k)</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper orange">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><line x1="12" y1="6" x2="12" y2="18"/></svg>
              </div>
              <div className="stat-info">
                <div className="stat-value">{reports.pendingCredits?.length || 0}</div>
                <div className="stat-label">Debtor Accounts</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper red">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <div className="stat-info">
                <div className="stat-value">{formatCurrency((reports.pendingCredits || []).reduce((acc, c) => acc + c.pendingAmount, 0))}</div>
                <div className="stat-label">Total Credit Out</div>
              </div>
            </div>
          </div>

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
        </>
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
