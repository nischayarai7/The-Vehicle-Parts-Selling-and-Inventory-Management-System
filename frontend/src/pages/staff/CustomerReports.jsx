import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './CustomerReports.css';

const CustomerReports = () => {
  const [reports, setReports] = useState({ regulars: [], highSpenders: [], pendingCredits: [] });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Overdue Reminders & Drawer State
  const [selectedDebtor, setSelectedDebtor] = useState(null);
  const [debtorCredits, setDebtorCredits] = useState([]);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [sendingId, setSendingId] = useState(null);
  const [sendingBulk, setSendingBulk] = useState(false);
  const [sendingIndividualId, setSendingIndividualId] = useState(null);
  
  // Interactive Line Graph State
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Toast Notification State
  const [toast, setToast] = useState(null);

  // successAlert for overdue balances feedback
  const [successAlert, setSuccessAlert] = useState(null);

  // Pagination State
  const [regularsPage, setRegularsPage] = useState(1);
  const [highSpendersPage, setHighSpendersPage] = useState(1);
  const [pendingCreditsPage, setPendingCreditsPage] = useState(1);
  const itemsPerPage = 5;

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
      setLoading(true);
      const [reportsRes, ordersRes] = await Promise.all([
        api.getStaffCustomerReports(),
        api.getStaffOrders().catch(() => [])
      ]);
      setReports(reportsRes || { regulars: [], highSpenders: [], pendingCredits: [] });
      setOrders(ordersRes || []);
      setRegularsPage(1);
      setHighSpendersPage(1);
      setPendingCreditsPage(1);
    } catch (err) {
      console.error('Failed to fetch customer reports', err);
      showToast('Failed to retrieve analytics and ledger reports.', 'error');
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

  // Compile monthly revenue trends dynamically for the last 6 months
  const getMonthlyTrends = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trends = [];
    
    // Generate the last 6 months list chronologically
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      trends.push({
        label: `${months[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`,
        monthIndex: d.getMonth(),
        year: d.getFullYear(),
        sales: 0,
        count: 0
      });
    }

    // Accumulate real order metrics
    orders.forEach(o => {
      if (!o.createdAt) return;
      const orderDate = new Date(o.createdAt);
      const mIdx = orderDate.getMonth();
      const y = orderDate.getFullYear();
      
      const match = trends.find(t => t.monthIndex === mIdx && t.year === y);
      if (match) {
        match.sales += o.totalAmount;
        match.count += 1;
      }
    });

    return trends;
  };

  const monthlyTrends = getMonthlyTrends();

  // Paginated Slices
  const indexOfLastRegular = regularsPage * itemsPerPage;
  const indexOfFirstRegular = indexOfLastRegular - itemsPerPage;
  const currentRegulars = reports.regulars.slice(indexOfFirstRegular, indexOfLastRegular);
  const totalRegularsPages = Math.ceil(reports.regulars.length / itemsPerPage);

  const indexOfLastHighSpender = highSpendersPage * itemsPerPage;
  const indexOfFirstHighSpender = indexOfLastHighSpender - itemsPerPage;
  const currentHighSpenders = reports.highSpenders.slice(indexOfFirstHighSpender, indexOfLastHighSpender);
  const totalHighSpendersPages = Math.ceil(reports.highSpenders.length / itemsPerPage);

  const indexOfLastPendingCredit = pendingCreditsPage * itemsPerPage;
  const indexOfFirstPendingCredit = indexOfLastPendingCredit - itemsPerPage;
  const currentPendingCredits = (reports.pendingCredits || []).slice(indexOfFirstPendingCredit, indexOfLastPendingCredit);
  const totalPendingCreditsPages = Math.ceil((reports.pendingCredits || []).length / itemsPerPage);

  // SVG Line Graph Coordinate mapping parameters
  const chartWidth = 700;
  const chartHeight = 180;
  const paddingX = 50;
  const paddingY = 20;

  const salesValues = monthlyTrends.map(t => t.sales);
  const maxSales = Math.max(...salesValues, 5000); // Scale ceiling

  const chartPoints = monthlyTrends.map((t, idx) => {
    const x = paddingX + (idx * (chartWidth / 5));
    const y = chartHeight + paddingY - ((t.sales / maxSales) * chartHeight);
    return { x, y, ...t };
  });

  // Calculate sharp segment lines path
  const linePath = chartPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = chartPoints.length > 0 
    ? `${linePath} L ${chartPoints[chartPoints.length - 1].x} ${chartHeight + paddingY} L ${chartPoints[0].x} ${chartHeight + paddingY} Z`
    : '';

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
      const lineItem = debtorCredits.find(c => c.id === creditId);
      setSuccessAlert({
        title: "Individual Statement Dispatched",
        message: `A formal outstanding balance reminder email has been successfully sent to ${selectedDebtor.fullName}.`,
        recipient: selectedDebtor.email,
        details: lineItem ? `For: "${lineItem.description}" — ${formatCurrency(lineItem.amount)}` : null
      });
      if (selectedDebtor) {
        handleViewDebtorDetails(selectedDebtor);
      }
    } catch (err) {
      console.error('Failed to dispatch credit reminder', err);
      showToast(err?.message || err || 'Failed to dispatch email reminder.', 'error');
    } finally {
      setSendingId(null);
    }
  };

  const handleSendBulkReminders = async () => {
    setSendingBulk(true);
    try {
      const res = await api.sendAllOverdueCreditReminders();
      setSuccessAlert({
        title: "Bulk Reminders Transmitted",
        message: res?.message || "Overdue account balance statements successfully compiled and bulk-transmitted to all customer accounts overdue for more than 30 days.",
        recipient: "All Overdue Customer Accounts",
        details: `Dispatched system-wide statements to all accounts overdue by 30+ days.`
      });
      fetchReports();
    } catch (err) {
      console.error('Failed to dispatch bulk overdue reminders', err);
      showToast(err?.message || err || 'Failed to send bulk reminders.', 'error');
    } finally {
      setSendingBulk(false);
    }
  };

  const handleSendAllUserReminders = async (e, customer) => {
    e.stopPropagation(); // prevent opening the drawer
    if (sendingIndividualId) return;

    setSendingIndividualId(customer.id);
    try {
      const response = await fetch(`http://localhost:5270/api/PendingCredits/user/${customer.id}/send-all-reminders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to dispatch account balance statement.');
      }

      setSuccessAlert({
        title: "Account Statement Emailed!",
        message: "A professionally structured, complete outstanding statement breakdown has been dispatched successfully.",
        recipient: `${customer.fullName} (${customer.email})`,
        details: `Total Settlable Outstanding Balance: Rs. ${customer.pendingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      });
      fetchReports();
    } catch (err) {
      console.error("Failed to dispatch balance statement:", err);
      showToast(err?.message || err || "Failed to dispatch email statement.", "error");
    } finally {
      setSendingIndividualId(null);
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
          <div className="toast-content" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {toast.type === 'error' ? (
              <svg style={{ width: '16px', height: '16px', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            ) : (
              <svg style={{ width: '16px', height: '16px', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <div className="reports-header-row">
        <div>
          <h2>Customer Analytics & Reports</h2>
          <p className="subtitle">Real-time behavior tracking, lifetime value stats, and credit lines.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            onClick={fetchReports} 
            className="professional-pdf-btn" 
            style={{ 
              background: 'rgba(255, 255, 255, 0.04)', 
              border: '1px solid var(--admin-border)',
              color: 'var(--admin-text)'
            }}
            disabled={loading}
            title="Reload analytics and client ledger records"
          >
            <svg 
              className={loading ? "spin-animation" : ""} 
              style={{ width: '15px', height: '15px', flexShrink: 0 }} 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5"
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
            </svg>
            <span>{loading ? 'Refreshing...' : 'Refresh Data'}</span>
          </button>

          <button onClick={exportToPDF} className="professional-pdf-btn">
            <svg className="pdf-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            <span>Download Executive PDF</span>
          </button>
        </div>
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
                {/* VIP clients get an elegant Award Medal icon */}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
              </div>
              <div className="stat-info">
                <div className="stat-value">{reports.highSpenders?.filter(c => c.totalSpent > 10000).length || 0}</div>
                <div className="stat-label">V.I.P Clients (&gt;Rs.10k)</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper orange">
                {/* Debtor accounts get a User-Minus icon */}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
              </div>
              <div className="stat-info">
                <div className="stat-value">{reports.pendingCredits?.length || 0}</div>
                <div className="stat-label">Debtor Accounts</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper red">
                {/* Credit out gets an elegant Credit Card exposure icon */}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              </div>
              <div className="stat-info">
                <div className="stat-value">{formatCurrency((reports.pendingCredits || []).reduce((acc, c) => acc + c.pendingAmount, 0))}</div>
                <div className="stat-label">Total Credit Out</div>
              </div>
            </div>
          </div>

          {/* Revenue & Growth Analytics Chart Section */}
          <div className="report-card chart-container-card" style={{ marginBottom: '24px' }}>
            <div className="report-card-header flex-header">
              <div>
                <h3>📊 Dynamic Revenue & Transaction Trends</h3>
                <p>Interactive 6-month timeline tracking order volume and revenue generation.</p>
              </div>
              <div className="chart-legend">
                <span className="legend-item"><span className="legend-dot sales"></span> Sales Revenue</span>
                <span className="legend-item"><span className="legend-dot count"></span> Invoices Finalized</span>
              </div>
            </div>
            <div className="chart-body-wrapper" style={{ position: 'relative', padding: '24px 20px 20px 20px', overflowX: 'auto', overflowY: 'hidden' }}>
              
              {/* Floating Tooltip */}
              {hoveredPoint && (
                <div 
                  className="chart-tooltip-floating"
                  style={{ 
                    position: 'absolute', 
                    left: `${(hoveredPoint.x / 800) * 100}%`, 
                    top: `${hoveredPoint.y - 60}px`,
                    transform: 'translateX(-50%)',
                    zIndex: 10
                  }}
                >
                  <div className="tooltip-month">{hoveredPoint.label}</div>
                  <div className="tooltip-sales">Revenue: <strong>{formatCurrency(hoveredPoint.sales)}</strong></div>
                  <div className="tooltip-count">Orders: <strong>{hoveredPoint.count}</strong></div>
                </div>
              )}

              <svg width="100%" viewBox="0 0 800 220" style={{ minWidth: '600px', display: 'block', maxHeight: '300px' }} className="analytics-svg-graph">
                <defs>
                  <linearGradient id="salesGlowGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--admin-primary, #e04f5f)" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="var(--admin-primary, #e04f5f)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                  const yVal = paddingY + (ratio * chartHeight);
                  return (
                    <line 
                      key={`grid-${idx}`} 
                      x1={paddingX} 
                      y1={yVal} 
                      x2={paddingX + chartWidth} 
                      y2={yVal} 
                      stroke="var(--admin-border, #30363d)" 
                      strokeDasharray="4 6" 
                      strokeWidth="1" 
                    />
                  );
                })}

                {/* Border line */}
                <line x1={paddingX} y1={paddingY} x2={paddingX} y2={paddingY + chartHeight} stroke="var(--admin-border, #30363d)" strokeWidth="1" />
                <line x1={paddingX + chartWidth} y1={paddingY} x2={paddingX + chartWidth} y2={paddingY + chartHeight} stroke="var(--admin-border, #30363d)" strokeWidth="1" />

                {/* Area under line with gradient fill */}
                {areaPath && (
                  <path d={areaPath} fill="url(#salesGlowGradient)" />
                )}

                {/* Main Trend Line */}
                {linePath && (
                  <path 
                    d={linePath} 
                    fill="none" 
                    stroke="var(--admin-primary, #e04f5f)" 
                    strokeWidth="3.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    style={{ filter: 'drop-shadow(0px 4px 8px rgba(224, 79, 95, 0.4))' }}
                  />
                )}

                {/* Interactive Points / Hover Zones */}
                {chartPoints.map((p, idx) => (
                  <g key={`group-${idx}`} className="chart-marker-group">
                    <circle 
                      cx={p.x} 
                      cy={p.y} 
                      r={hoveredPoint && hoveredPoint.idx === idx ? 8 : 5} 
                      fill="var(--admin-card-bg, #161b22)" 
                      stroke="var(--admin-primary, #e04f5f)" 
                      strokeWidth="3.5" 
                      style={{ transition: 'all 0.15s ease', cursor: 'pointer' }}
                      onMouseEnter={() => setHoveredPoint({ ...p, idx })}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                    
                    {/* Invisible Larger Interactive Hover Target */}
                    <circle 
                      cx={p.x} 
                      cy={p.y} 
                      r="16" 
                      fill="transparent" 
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() => setHoveredPoint({ ...p, idx })}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  </g>
                ))}

                {/* X Axis Month Labels */}
                {chartPoints.map((p, idx) => (
                  <text 
                    key={`label-${idx}`}
                    x={p.x} 
                    y={chartHeight + paddingY + 18} 
                    fill="var(--admin-text-muted, #8b949e)" 
                    fontSize="10" 
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    {p.label}
                  </text>
                ))}
              </svg>
            </div>
          </div>

          <div className="reports-grid">
            {/* Top Regulars */}
            <div className="report-card" style={{ display: 'flex', flexDirection: 'column' }}>
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
                        <td colSpan="4" style={{ textAlign: 'center', padding: '48px 20px' }}>
                          <div className="reports-empty-state">
                            <div className="empty-state-icon-wrapper">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                            </div>
                            <h4>No Regular Clients Found</h4>
                            <p className="empty-state-text">Customer activity metric logs will assemble here once sales transactions are registered.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      currentRegulars.map((c, index) => (
                        <tr key={`reg-${c.id}`}>
                          <td>#{indexOfFirstRegular + index + 1}</td>
                          <td className="customer-name">{c.fullName}</td>
                          <td className="text-muted">{c.email}</td>
                          <td className="highlight-value">{c.orderCount}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {totalRegularsPages > 1 && (
                <div className="reports-pagination">
                  <button 
                    className="pagination-btn" 
                    onClick={() => setRegularsPage(prev => Math.max(prev - 1, 1))} 
                    disabled={regularsPage === 1}
                  >
                    <svg style={{ width: '12px', height: '12px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                    Prev
                  </button>
                  <span className="pagination-info">Page {regularsPage} of {totalRegularsPages}</span>
                  <button 
                    className="pagination-btn" 
                    onClick={() => setRegularsPage(prev => Math.min(prev + 1, totalRegularsPages))} 
                    disabled={regularsPage === totalRegularsPages}
                  >
                    Next
                    <svg style={{ width: '12px', height: '12px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                </div>
              )}
            </div>

            {/* High Spenders */}
            <div className="report-card" style={{ display: 'flex', flexDirection: 'column' }}>
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
                        <td colSpan="4" style={{ textAlign: 'center', padding: '48px 20px' }}>
                          <div className="reports-empty-state">
                            <div className="empty-state-icon-wrapper" style={{ color: '#ff9800', background: 'rgba(255, 152, 0, 0.1)' }}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="7"/><polyline points="8 21 12 17 16 21"/></svg>
                            </div>
                            <h4>No VIP Spenders Logged</h4>
                            <p className="empty-state-text">Customers ranked by their cumulative lifetime expenditure statements will list here.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      currentHighSpenders.map((c, index) => (
                        <tr key={`high-${c.id}`}>
                          <td>#{indexOfFirstHighSpender + index + 1}</td>
                          <td className="customer-name">{c.fullName}</td>
                          <td className="text-muted">{c.email}</td>
                          <td className="highlight-value">{formatCurrency(c.totalSpent)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {totalHighSpendersPages > 1 && (
                <div className="reports-pagination">
                  <button 
                    className="pagination-btn" 
                    onClick={() => setHighSpendersPage(prev => Math.max(prev - 1, 1))} 
                    disabled={highSpendersPage === 1}
                  >
                    <svg style={{ width: '12px', height: '12px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                    Prev
                  </button>
                  <span className="pagination-info">Page {highSpendersPage} of {totalHighSpendersPages}</span>
                  <button 
                    className="pagination-btn" 
                    onClick={() => setHighSpendersPage(prev => Math.min(prev + 1, totalHighSpendersPages))} 
                    disabled={highSpendersPage === totalHighSpendersPages}
                  >
                    Next
                    <svg style={{ width: '12px', height: '12px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                </div>
              )}
            </div>

            {/* Pending Credits */}
            <div className="report-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="report-card-header flex-header">
                <div>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg style={{ width: '18px', height: '18px', color: '#ff9800' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    <span>Pending Credits</span>
                  </h3>
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
                      <th>Email/Contact</th>
                      <th>Last Issued Credit</th>
                      <th>Total Balance</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!reports.pendingCredits || reports.pendingCredits.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '48px 20px' }}>
                          <div className="reports-empty-state success-state">
                            <div className="empty-state-icon-wrapper" style={{ color: '#4caf50', background: 'rgba(76, 175, 80, 0.1)' }}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                            </div>
                            <h4 style={{ color: '#4caf50' }}>All Accounts Settled</h4>
                            <p className="empty-state-text">Excellent! No customer accounts are currently carrying outstanding or overdue credit balances.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      currentPendingCredits.map((c, index) => {
                        const formattedDate = c.latestCreditDate 
                          ? new Date(c.latestCreditDate).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            }) 
                          : 'N/A';
                        return (
                          <tr 
                            key={`credit-${c.id}`} 
                            className="interactive-row" 
                            onClick={() => handleViewDebtorDetails(c)}
                            title="Click to view detailed outstanding statement history & notify"
                          >
                            <td>#{indexOfFirstPendingCredit + index + 1}</td>
                            <td className="customer-name">{c.fullName}</td>
                            <td className="text-muted">{c.email}</td>
                            <td className="text-muted" style={{ fontSize: '12px' }}>{formattedDate}</td>
                            <td className="highlight-value" style={{ color: '#e04f5f' }}>{formatCurrency(c.pendingAmount)}</td>
                            <td style={{ textAlign: 'right' }}>
                              <button 
                                className="btn-action-email"
                                style={{ padding: '5px 12px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '4px' }}
                                onClick={(e) => handleSendAllUserReminders(e, c)}
                                disabled={sendingIndividualId === c.id}
                                title={`Send compiled credit statement email to ${c.fullName}`}
                              >
                                {sendingIndividualId === c.id ? (
                                  <span className="mini-spinner" style={{ width: '10px', height: '10px', borderWidth: '1.5px' }}></span>
                                ) : (
                                  <>
                                    <svg style={{ width: '11px', height: '11px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                                    Alert Email
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
              {totalPendingCreditsPages > 1 && (
                <div className="reports-pagination">
                  <button 
                    className="pagination-btn" 
                    onClick={() => setPendingCreditsPage(prev => Math.max(prev - 1, 1))} 
                    disabled={pendingCreditsPage === 1}
                  >
                    <svg style={{ width: '12px', height: '12px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                    Prev
                  </button>
                  <span className="pagination-info">Page {pendingCreditsPage} of {totalPendingCreditsPages}</span>
                  <button 
                    className="pagination-btn" 
                    onClick={() => setPendingCreditsPage(prev => Math.min(prev + 1, totalPendingCreditsPages))} 
                    disabled={pendingCreditsPage === totalPendingCreditsPages}
                  >
                    Next
                    <svg style={{ width: '12px', height: '12px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                </div>
              )}
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
                <div className="drawer-subtitle" style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                    {selectedDebtor.email}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                    <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Customer ID: {selectedDebtor.id}
                  </span>
                </div>
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
                              {new Date(c.createdAt).toLocaleString('en-US', {
                                weekday: 'short',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </span>
                             {isOverdue ? (
                              <span className="due-badge overdue" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <svg style={{ width: '11px', height: '11px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                Overdue ({days}d)
                              </span>
                            ) : (
                              <span className="due-badge safe">{days}d pending</span>
                            )}
                          </div>
                          
                          <div className="credit-desc-container" style={{ margin: '12px 0' }}>
                            <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)', marginBottom: '4px' }}>
                              Transaction ID: #{c.id.toString().padStart(6, '0')}
                            </div>
                            <p className="credit-desc" style={{ margin: 0, fontWeight: '500', color: 'var(--admin-text)' }}>
                              {c.description || 'General Account Credit balance'}
                            </p>
                          </div>
                          
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

      {/* Premium Success Modal Alert */}
      {successAlert && (
        <div className="reports-modal-overlay" onClick={() => setSuccessAlert(null)}>
          <div className="reports-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="success-icon-container">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            
            <h3 className="modal-title">{successAlert.title}</h3>
            <p className="modal-message">{successAlert.message}</p>
            
            <div className="modal-meta-box">
              <div className="meta-row">
                <span className="meta-label">Recipient:</span>
                <span className="meta-value">{successAlert.recipient}</span>
              </div>
              {successAlert.details && (
                <div className="meta-row">
                  <span className="meta-label">Details:</span>
                  <span className="meta-value text-cherry">{successAlert.details}</span>
                </div>
              )}
              <div className="meta-row">
                <span className="meta-label">Timestamp:</span>
                <span className="meta-value">Just now ({new Date().toLocaleTimeString()})</span>
              </div>
            </div>

            <button className="modal-dismiss-btn" onClick={() => setSuccessAlert(null)}>
              Acknowledge & Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerReports;
