import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { api } from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './CustomerDashboard.css';



const CustomerDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  
  const [stats, setStats] = useState({
    activeAppointments: 0,
    pendingRequests: 0,
    totalOrders: 0
  });

  const [spendingStats, setSpendingStats] = useState({
    totalSpentLastMonth: 0,
    recentSpent: 0,
    recentItemName: '',
    recentItemImage: null,
    averageOrderValue: 0
  });
  
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [myVehicles, setMyVehicles] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dynamic dependencies in parallel
      const [appointmentsRes, requestsRes, ordersRes, vehiclesRes] = await Promise.all([
        api.getMyAppointments().catch(() => ({ data: [] })),
        api.getMyPartRequests().catch(() => []),
        api.getMyOrders().catch(() => []),
        api.getMyVehicles().catch(() => [])
      ]);

      const appointments = appointmentsRes.data || (Array.isArray(appointmentsRes) ? appointmentsRes : []);
      const requests = requestsRes.data || (Array.isArray(requestsRes) ? requestsRes : []);
      const orders = ordersRes.data || (Array.isArray(ordersRes) ? ordersRes : []);

      setOrdersList(orders || []);

      const activeAppointments = appointments.filter(a => a.status === 'Pending' || a.status === 'Confirmed').length;
      const pendingRequests = requests.filter(r => r.status === 'Pending').length;
      const totalOrders = orders.length;

      setStats({
        activeAppointments,
        pendingRequests,
        totalOrders
      });

      setMyVehicles(vehiclesRes || []);

      // Calculate spending statistics dynamically
      const now = new Date();
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(now.getMonth() - 1);

      const validOrders = orders.filter(o => o.status !== 'Cancelled');

      const totalSpentLastMonth = validOrders
        .filter(o => new Date(o.createdAt) >= oneMonthAgo)
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      const totalSpentAllTime = validOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const averageOrderValue = validOrders.length > 0
        ? totalSpentAllTime / validOrders.length
        : 0;

      let recentSpent = 0;
      let recentItemName = 'No items purchased';
      let recentItemImage = null;

      // Find the most recent order to fetch item details
      const sortedOrders = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      if (sortedOrders.length > 0) {
        const latestOrder = sortedOrders[0];
        recentSpent = latestOrder.totalAmount || 0;

        try {
          // Fetch detailed information of the latest order to get part names/images
          const details = await api.getCustomerOrderDetails(latestOrder.id);
          if (details && details.items && details.items.length > 0) {
            recentItemName = details.items[0].partName || 'Unknown Component';
            recentItemImage = details.items[0].partImage || null;
          }
        } catch (err) {
          console.error('Failed to load recent order details:', err);
        }
      }

      setSpendingStats({
        totalSpentLastMonth,
        recentSpent,
        recentItemName,
        recentItemImage,
        averageOrderValue
      });

      // Get latest 5 recent appointments
      const sortedAppointments = [...appointments]
        .sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate))
        .slice(0, 5);
      
      setRecentAppointments(sortedAppointments);

    } catch (err) {
      console.error('Failed to load customer dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportFinancialPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;

      // --- Elegant Header Decorator ---
      doc.setFillColor(33, 37, 41); // Slate Dark Theme
      doc.rect(0, 0, pageWidth, 40, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text("6IX7EVEN AUTO PARTS", 14, 18);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text("CUSTOMER PORTAL - FINANCIAL OVERVIEW & EXPENDITURES SUMMARY", 14, 30);

      // Metadata Right-aligned
      const customerName = user?.fullName || 'Valued Customer';
      doc.setFontSize(9);
      doc.text(`REPORT TYPE: PERSONAL FINANCIAL STATEMENT`, pageWidth - 90, 16);
      doc.text(`CUSTOMER: ${customerName.toUpperCase()}`, pageWidth - 90, 23);
      doc.text(`DATE GENERATED: ${new Date().toLocaleDateString()}`, pageWidth - 90, 30);

      // Reset styles
      doc.setTextColor(33, 37, 41);
      
      // --- 1. Spending Metrics Overview Table ---
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text("1. Spending Insights & Metrics", 14, 52);

      const metricsRows = [
        ["Financial KPI Metric", "Amount (NPR)"],
        ["Spent (Last 30 Days)", `Rs. ${spendingStats.totalSpentLastMonth.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
        ["Recent Order Amount", `Rs. ${spendingStats.recentSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
        ["Average Order Value", `Rs. ${spendingStats.averageOrderValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
        ["Total Orders Logged", stats.totalOrders.toString()]
      ];

      autoTable(doc, {
        startY: 57,
        head: [metricsRows[0]],
        body: metricsRows.slice(1),
        theme: 'grid',
        headStyles: { fillColor: [46, 204, 113], textColor: [255, 255, 255] }, // Premium Green Theme
        columnStyles: {
          0: { fontStyle: 'bold', width: 110 },
          1: { halign: 'right' }
        }
      });

      let lastY = doc.lastAutoTable.finalY + 15;

      // --- 2. Master Historical Ledger Table ---
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text("2. Storefront Account Transactions", 14, lastY);

      const orderHeaders = [["Order ID", "Reference Number", "Placed Date", "Total Expenditure", "Status"]];
      const orderBody = ordersList.map(o => [
        `#${o.id}`,
        o.orderNumber || 'ORD-REF',
        new Date(o.createdAt).toLocaleDateString(),
        `Rs. ${o.totalAmount?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}`,
        o.status || 'Pending'
      ]);

      autoTable(doc, {
        startY: lastY + 5,
        head: orderHeaders,
        body: orderBody.length > 0 ? orderBody : [["No transactions recorded", "", "", "", ""]],
        theme: 'striped',
        headStyles: { fillColor: [54, 69, 79], textColor: [255, 255, 255] },
        columnStyles: {
          3: { halign: 'right' }
        }
      });

      // --- 3. Footer ---
      lastY = doc.lastAutoTable.finalY + 20;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text("This is an electronically generated customer portal financial summary.", 14, lastY);
      doc.text("Thank you for being a valued client of 6ix7even Auto Parts.", 14, lastY + 5);

      doc.save(`Customer_Financial_Report_${new Date().getFullYear()}.pdf`);
    } catch (error) {
      console.error("Failed to export PDF statement:", error);
    }
  };

  const todayDateString = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  if (loading) {
    return (
      <div className="spinner-wrapper">
        <div className="loading-spinner"></div>
        <p style={{ marginTop: '16px' }}>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="staff-dashboard-container">
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-text">
          <h2>Welcome Back, {user?.fullName || 'Customer'}!</h2>
          <p>Here is your overview at 6ix7even Auto Parts today.</p>
        </div>
        <div className="welcome-date-badge">
          <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> {todayDateString}
        </div>
      </div>

      {/* Dynamic KPI summary row */}
      <div className="staff-kpi-grid">
        <div className="staff-kpi-card">
          <div className="kpi-icon-wrapper invoices">
            <svg style={{ width: '22px', height: '22px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div className="kpi-info-content">
            <span className="kpi-title">Active Appointments</span>
            <span className="kpi-value">{stats.activeAppointments}</span>
          </div>
        </div>

        <div className="staff-kpi-card">
          <div className="kpi-icon-wrapper parts">
            <svg style={{ width: '22px', height: '22px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
          </div>
          <div className="kpi-info-content">
            <span className="kpi-title">Pending Part Requests</span>
            <span className="kpi-value">{stats.pendingRequests}</span>
          </div>
        </div>

        <div className="staff-kpi-card">
          <div className="kpi-icon-wrapper customers">
            <svg style={{ width: '22px', height: '22px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          </div>
          <div className="kpi-info-content">
            <span className="kpi-title">Total Orders</span>
            <span className="kpi-value">{stats.totalOrders}</span>
          </div>
        </div>
      </div>

      {/* Spending Insights Section */}
      <div className="spending-insights-section" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 className="section-title" style={{ margin: 0 }}>Spending Insights & Analytics</h3>
          <button 
            onClick={handleExportFinancialPDF}
            className="professional-pdf-btn"
            style={{ padding: '8px 16px', fontSize: '12px' }}
          >
            <svg className="pdf-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '13px', height: '13px' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            <span>Export Statement</span>
          </button>
        </div>
        <div className="spending-grid">
          <div className="spending-card">
            <div className="spending-card-header">
              <div className="spending-icon-wrapper month-spent">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
              </div>
              <span className="spending-card-title">Spent (Last 30 Days)</span>
            </div>
            <div className="spending-card-value">Rs. {spendingStats.totalSpentLastMonth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="spending-card-subtext">Sum of completed storefront orders</p>
          </div>

          <div className="spending-card">
            <div className="spending-card-header">
              <div className="spending-icon-wrapper recent-spent">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              </div>
              <span className="spending-card-title">Recent Order Amount</span>
            </div>
            <div className="spending-card-value">Rs. {spendingStats.recentSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="spending-card-subtext">Amount of your latest order</p>
          </div>

          <div className="spending-card">
            <div className="spending-card-header">
              <div className="spending-icon-wrapper avg-spent">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
              </div>
              <span className="spending-card-title">Average Order Value</span>
            </div>
            <div className="spending-card-value">Rs. {spendingStats.averageOrderValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="spending-card-subtext">Average spend across all orders</p>
          </div>

          <div className="spending-card recent-item-card">
            <div className="spending-card-header">
              <div className="spending-icon-wrapper recent-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
              </div>
              <span className="spending-card-title">Last Item Purchased</span>
            </div>
            <div className="spending-item-content">
              {spendingStats.recentItemImage ? (
                <img src={spendingStats.recentItemImage} alt={spendingStats.recentItemName} className="spending-item-thumbnail" />
              ) : (
                <div className="spending-item-thumbnail" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d1117', border: '1px solid var(--admin-border)' }}>
                  <svg style={{ width: '18px', height: '18px', color: 'var(--admin-text-muted)', opacity: 0.6 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                </div>
              )}
              <div className="spending-item-details">
                <div className="spending-item-name">{spendingStats.recentItemName}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Dashboard Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', alignItems: 'start', marginTop: '10px' }}>
        
        {/* Recent Appointments Section */}
        <div className="recent-invoices-section">
          <div className="recent-invoices-header">
            <h3>Your Recent Appointments</h3>
            <Link to="/customer/appointments" className="btn-table-action" style={{ fontSize: '12px' }}>
              View All
            </Link>
          </div>
          <div className="recent-table-wrapper">
            <table className="recent-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Service</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentAppointments.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', color: 'var(--admin-text-muted)', padding: '24px' }}>
                      No appointments booked yet.
                    </td>
                  </tr>
                ) : (
                  recentAppointments.map((a) => (
                    <tr key={a.id}>
                      <td style={{ fontWeight: '600', color: '#fff' }}>
                        {new Date(a.appointmentDate).toLocaleDateString()}
                      </td>
                      <td>{a.serviceType}</td>
                      <td>
                        <span className={`status-pill ${a.status.toLowerCase()}`}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* My Garage Overview Section */}
        <div className="recent-invoices-section">
          <div className="recent-invoices-header">
            <h3>My Garage ({myVehicles.length})</h3>
            <Link to="/customer/garage" className="btn-table-action" style={{ fontSize: '12px', background: '#1890ff', borderColor: '#1890ff' }}>
              Manage Garage
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
            {myVehicles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--admin-text-muted)' }}>
                <svg style={{ width: '42px', height: '42px', color: 'var(--admin-text-muted)', marginBottom: '12px', opacity: 0.5 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                  <circle cx="7" cy="17" r="2" />
                  <path d="M9 17h6" />
                  <circle cx="17" cy="17" r="2" />
                </svg>
                <p style={{ marginTop: '4px', fontSize: '13px' }}>Your garage is currently empty.</p>
                <Link to="/customer/garage" style={{ display: 'inline-block', marginTop: '10px', fontSize: '12px', color: '#1890ff', textDecoration: 'none', fontWeight: 'bold' }}>
                  + Add Your Vehicle
                </Link>
              </div>
            ) : (
              myVehicles.map((v) => (
                <div 
                  key={v.id} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '12px 16px', 
                    background: '#161b22', 
                    border: '1px solid #30363d', 
                    borderRadius: '8px' 
                  }}
                >
                  <div>
                    <h4 style={{ margin: 0, color: '#fff', fontSize: '14px', fontWeight: '600' }}>
                      {v.displayName || `${v.make} ${v.model}`}
                    </h4>
                    <span style={{ fontSize: '12px', color: '#8b949e' }}>Year: {v.year || 'N/A'}</span>
                  </div>
                  {v.licensePlate ? (
                    <span style={{ 
                      background: '#0d1117', 
                      border: '1px solid #30363d', 
                      padding: '2px 8px', 
                      borderRadius: '4px', 
                      fontSize: '11px', 
                      fontWeight: '700', 
                      color: '#58a6ff',
                      letterSpacing: '0.5px' 
                    }}>
                      {v.licensePlate}
                    </span>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CustomerDashboard;
