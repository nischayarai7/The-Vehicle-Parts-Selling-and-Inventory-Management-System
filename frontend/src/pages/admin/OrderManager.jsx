import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import './OrderManager.css';

const OrderManager = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Selected Order Modal state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [sendingInvoiceId, setSendingInvoiceId] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  
  // Toast notifications
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.getStaffOrders();
      setOrders(response || []);
    } catch (err) {
      console.error('Failed to load orders', err);
      setError(err.message || 'Failed to fetch customer orders.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (orderId) => {
    setModalLoading(true);
    try {
      const details = await api.getStaffOrderDetails(orderId);
      setSelectedOrder(details);
    } catch (err) {
      console.error('Failed to load order details', err);
      showToast(err.message || 'Failed to load order details.', 'error');
    } finally {
      setModalLoading(false);
    }
  };

  const handleSendInvoice = async (orderId, e) => {
    if (e) e.stopPropagation();
    setSendingInvoiceId(orderId);
    try {
      await api.sendStaffOrderInvoice(orderId);
      showToast(`Invoice sent successfully to customer's email!`);
    } catch (err) {
      console.error('Failed to send invoice email', err);
      showToast(err.message || 'Failed to send invoice email.', 'error');
    } finally {
      setSendingInvoiceId(null);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingStatusId(orderId);
    try {
      await api.updateOrderStatus(orderId, newStatus);
      showToast(`Order status updated to "${newStatus}"!`);
      
      // Update local order details modal if open
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      }
      
      // Refresh backend list
      const refreshedResponse = await api.getStaffOrders();
      setOrders(refreshedResponse || []);
    } catch (err) {
      console.error('Failed to update status', err);
      showToast(err.message || 'Failed to update order status.', 'error');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'NPR'
    }).format(val || 0);
  };

  // Filter & Search Logic
  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.customerName || '').toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // KPI Calculations
  const completedOrders = orders.filter(o => o.status === 'Completed');
  const totalGrossRevenue = completedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalOrdersCount = orders.length;
  const averageBasketValue = totalOrdersCount > 0 
    ? orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) / totalOrdersCount 
    : 0;

  // Pagination Calculations
  const totalItems = filteredOrders.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Reset page when queries change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  return (
    <div className="order-manager-container">
      {/* Toast Messages */}
      {toast && (
        <div className={`admin-toast ${toast.type}`}>
          <div className="toast-content">
            {toast.type === 'error' ? '⚠️' : '✅'} {toast.message}
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="orders-header-row">
        <div>
          <h2>Order & Sales Manager</h2>
          <p className="subtitle">Track customer orders, update delivery/invoice status, and manage POS settlements.</p>
        </div>
        <button className="admin-btn-outline flex-btn" onClick={fetchOrders} disabled={loading}>
          <svg 
            className={`refresh-icon-svg ${loading ? 'spinning' : ''}`} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5"
          >
            <path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          <span>{loading ? 'Refreshing...' : 'Refresh Ledger'}</span>
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="orders-kpi-grid">
        <div className="kpi-card orders-count-card">
          <div className="kpi-header">
            <span>Overall Order Bookings</span>
            <svg className="kpi-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          </div>
          <h3>{totalOrdersCount}</h3>
          <p className="kpi-subtext">Total sales invoices recorded</p>
        </div>

        <div className="kpi-card revenue-card">
          <div className="kpi-header">
            <span>Gross Settled Sales</span>
            <span className="profit-badge gain">SETTLED</span>
          </div>
          <h3 className="gain-text">{formatCurrency(totalGrossRevenue)}</h3>
          <p className="kpi-subtext">Sum of all completed checkouts</p>
        </div>

        <div className="kpi-card average-card">
          <div className="kpi-header">
            <span>Average Basket Settlement</span>
            <svg className="kpi-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22m5-18H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <h3>{formatCurrency(averageBasketValue)}</h3>
          <p className="kpi-subtext">Average spend per client visit</p>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="orders-toolbar">
        <div className="search-box-wrap">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input 
            type="text" 
            placeholder="Search by order number or customer name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="toolbar-search-input"
          />
        </div>

        <div className="filter-select-wrap">
          <label>Status Filter:</label>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="toolbar-select"
          >
            <option value="All">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="Pending">Pending</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Core Orders Table */}
      {loading ? (
        <div className="orders-loading-box">
          <div className="loading-spinner"></div>
          <p>Auditing sales transaction book...</p>
        </div>
      ) : error ? (
        <div className="orders-error-box">
          <p>⚠️ Error: {error}</p>
          <button className="admin-btn-outline" onClick={fetchOrders}>Retry Fetch</button>
        </div>
      ) : (
        <div className="orders-table-card">
          <div className="table-wrapper">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order Number</th>
                  <th>Customer</th>
                  <th>Date & Time</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-table-row">No orders found matching the filter criteria.</td>
                  </tr>
                ) : (
                  paginatedOrders.map((o) => (
                    <tr key={o.id} className="interactive-row" onClick={() => handleViewDetails(o.id)}>
                      <td className="order-num-cell">#{o.orderNumber}</td>
                      <td className="cust-cell">{o.customerName || 'Walk-in Customer'}</td>
                      <td className="date-cell">{new Date(o.createdAt).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</td>
                      <td className="total-cell font-bold">{formatCurrency(o.totalAmount)}</td>
                      <td>
                        <span className={`status-badge ${o.status.toLowerCase()}`}>
                          {o.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                        <div className="order-actions-row">
                          <button 
                            className="btn-action-view"
                            onClick={() => handleViewDetails(o.id)}
                            title="View Order Details"
                          >
                            <svg className="btn-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '13px', height: '13px' }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            <span>View</span>
                          </button>
                          
                          <button 
                            className="btn-action-email"
                            onClick={(e) => handleSendInvoice(o.id, e)}
                            disabled={sendingInvoiceId === o.id}
                            title="Send Invoice Email"
                          >
                            {sendingInvoiceId === o.id ? (
                              <span className="mini-spinner"></span>
                            ) : (
                              <>
                                <svg className="btn-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '13px', height: '13px' }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                                <span>Email</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="table-pagination-row">
              <span className="pagination-text">
                Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} orders
              </span>
              <div className="pagination-buttons">
                <button 
                  className="page-nav-btn" 
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ width: '10px', height: '10px' }}><polyline points="15 18 9 12 15 6"/></svg>
                  <span>Previous</span>
                </button>
                <span className="page-indicator">
                  Page {currentPage} of {totalPages}
                </span>
                <button 
                  className="page-nav-btn" 
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <span>Next</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ width: '10px', height: '10px' }}><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detailed Order Modal */}
      {(selectedOrder || modalLoading) && (
        <div className="order-modal-backdrop" onClick={() => setSelectedOrder(null)}>
          <div className="order-modal-content" onClick={(e) => e.stopPropagation()}>
            {modalLoading ? (
              <div className="modal-loading-box">
                <div className="loading-spinner"></div>
                <p>Retrieving transaction breakdown...</p>
              </div>
            ) : (
              <>
                {/* Modal Header */}
                <div className="modal-header-section no-print">
                  <div>
                    <h3>Order #{selectedOrder.orderNumber} Details</h3>
                    <p className="modal-subtitle">Invoice date: {new Date(selectedOrder.createdAt).toLocaleDateString()}</p>
                  </div>
                  <button className="btn-close-modal" onClick={() => setSelectedOrder(null)}>✕</button>
                </div>

                {/* Print Invoice Frame */}
                <div className="invoice-print-frame">
                  {/* Invisible in Dashboard, visible only during window.print() */}
                  <div className="print-header-decor">
                    <h1>6IX7EVEN AUTO PARTS</h1>
                    <p>Sales Invoice | Order #{selectedOrder.orderNumber}</p>
                  </div>

                  <div className="modal-body-columns">
                    {/* Column 1: Order/Customer Specs */}
                    <div className="specs-column">
                      <div className="specs-section">
                        <h4>Billing Account:</h4>
                        <div className="spec-item">
                          <label>Full Name:</label>
                          <span>{selectedOrder.customerName}</span>
                        </div>
                        <div className="spec-item">
                          <label>Email Address:</label>
                          <span>{selectedOrder.customerEmail}</span>
                        </div>
                        <div className="spec-item">
                          <label>Date Registered:</label>
                          <span>{new Date(selectedOrder.createdAt).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="specs-section no-print">
                        <h4>Administrative Actions:</h4>
                        <div className="spec-item-status-update">
                          <label>Workflow Status:</label>
                          <select 
                            value={selectedOrder.status}
                            onChange={(e) => handleUpdateStatus(selectedOrder.id, e.target.value)}
                            disabled={updatingStatusId !== null}
                            className="modal-status-select"
                          >
                            <option value="Completed">Completed</option>
                            <option value="Pending">Pending</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>

                      {selectedOrder.notes && (
                        <div className="specs-section">
                          <h4>Transaction Memo/Notes:</h4>
                          <p className="order-notes-para">{selectedOrder.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Column 2: Items Grid */}
                    <div className="items-column">
                      <h4>Ordered Components Breakdown</h4>
                      <div className="modal-table-wrapper">
                        <table className="modal-items-table">
                          <thead>
                            <tr>
                              <th>Component Part Name</th>
                              <th style={{ textAlign: 'center' }}>Qty</th>
                              <th style={{ textAlign: 'right' }}>Unit Rate</th>
                              <th style={{ textAlign: 'right' }}>Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedOrder.items.map((item) => (
                              <tr key={item.id}>
                                <td className="part-title">{item.partName}</td>
                                <td style={{ textAlign: 'center' }} className="font-bold">{item.quantity}</td>
                                <td style={{ textAlign: 'right' }}>{formatCurrency(item.unitPrice)}</td>
                                <td style={{ textAlign: 'right' }} className="font-bold gain-text">{formatCurrency(item.subtotal)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="tfoot-totals-row">
                              <td colSpan="3" style={{ textAlign: 'right' }} className="font-bold">Total Amount Due:</td>
                              <td style={{ textAlign: 'right' }} className="font-bold val-total">{formatCurrency(selectedOrder.totalAmount)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer Controls */}
                <div className="modal-footer-section no-print">
                  <div className="footer-left-buttons">
                    <button 
                      onClick={() => handleSendInvoice(selectedOrder.id)} 
                      className="btn-modal-action email"
                      disabled={sendingInvoiceId === selectedOrder.id}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      {sendingInvoiceId === selectedOrder.id ? (
                        <span className="mini-spinner"></span>
                      ) : (
                        <>
                          <svg className="btn-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '14px', height: '14px' }}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                          <span>Send Email Invoice</span>
                        </>
                      )}
                    </button>
                    <button 
                      onClick={handlePrint} 
                      className="btn-modal-action print"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <svg className="btn-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '14px', height: '14px' }}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                      <span>Print Invoice</span>
                    </button>
                  </div>
                  <button className="admin-btn-outline" onClick={() => setSelectedOrder(null)}>
                    Close Details
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManager;
