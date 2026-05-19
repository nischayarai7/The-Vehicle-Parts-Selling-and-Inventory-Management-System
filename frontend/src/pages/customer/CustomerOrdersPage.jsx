import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './CustomerOrdersPage.css';

const CustomerOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Detailed Modal View State
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const itemsPerPage = 6;

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.getMyOrders();
      setOrders(res || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadHistoryPDF = async () => {
    if (!orders || orders.length === 0) return;

    try {
      setLoading(true);
      // Fetch details of all orders in parallel to get full details dynamically!
      const detailedOrders = await Promise.all(
        orders.map(async (o) => {
          try {
            const detail = await api.getOrderDetails(o.id);
            return detail.data || detail;
          } catch (e) {
            return null;
          }
        })
      );

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
      doc.text("CUSTOMER PURCHASE & ORDER STATEMENT", 14, 30);

      // Metadata Right-aligned
      const customerName = api.getUser()?.fullName || 'Valued Customer';
      doc.setFontSize(9);
      doc.text(`STATEMENT TYPE: FULL HISTORICAL REPORT`, pageWidth - 90, 16);
      doc.text(`CUSTOMER: ${customerName.toUpperCase()}`, pageWidth - 90, 23);
      doc.text(`DATE GENERATED: ${new Date().toLocaleDateString()}`, pageWidth - 90, 30);

      // Reset styles
      doc.setTextColor(33, 37, 41);
      
      // --- 1. Executive Summary Block ---
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text("1. Historical Overview Summary", 14, 52);

      const totalSpent = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const completedOrders = orders.filter(o => {
        const status = (o.status || '').toLowerCase();
        return status === 'completed' || status === 'delivered';
      }).length;

      const summaryRows = [
        ["Parameter", "Historical Record Value"],
        ["Total Placed Orders", orders.length.toString()],
        ["Successful Completed Orders", completedOrders.toString()],
        ["Total Account Expenditures", `Rs. ${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
        ["Statement Generation Time", new Date().toLocaleTimeString()]
      ];

      autoTable(doc, {
        startY: 57,
        head: [summaryRows[0]],
        body: summaryRows.slice(1),
        theme: 'grid',
        headStyles: { fillColor: [46, 160, 67], textColor: [255, 255, 255] }, // Elegant Green theme
        columnStyles: {
          0: { fontStyle: 'bold', width: 90 },
          1: { halign: 'right' }
        }
      });

      let lastY = doc.lastAutoTable.finalY + 15;

      // --- 2. Master Purchases Index Table ---
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text("2. Purchase Orders Log", 14, lastY);

      const orderHeaders = [["Order ID", "Reference Number", "Placed Date", "Parts Count", "Total Amount", "Status"]];
      const orderBody = orders.map(o => [
        `#${o.id}`,
        o.orderNumber || 'N/A',
        new Date(o.createdAt).toLocaleDateString(),
        (o.itemCount || 1).toString(),
        `Rs. ${o.totalAmount?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}`,
        o.status || 'Pending'
      ]);

      autoTable(doc, {
        startY: lastY + 5,
        head: orderHeaders,
        body: orderBody,
        theme: 'striped',
        headStyles: { fillColor: [54, 69, 79], textColor: [255, 255, 255] },
        columnStyles: {
          4: { halign: 'right' }
        }
      });

      lastY = doc.lastAutoTable.finalY + 15;

      // --- 3. Detailed Itemized Breakdown Section ---
      if (lastY > doc.internal.pageSize.height - 40) {
        doc.addPage();
        lastY = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text("3. Detailed Parts Breakdown per Purchase", 14, lastY);
      lastY += 6;

      detailedOrders.forEach((o) => {
        if (!o) return;
        if (lastY > doc.internal.pageSize.height - 60) {
          doc.addPage();
          lastY = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(`Order #${o.id} - ${o.orderNumber || 'ORD-REF'} (${new Date(o.createdAt).toLocaleDateString()})`, 14, lastY);
        lastY += 4;

        const items = o.items || [];
        const itemRows = items.map((i, idx) => [
          `#${idx + 1}`,
          i.partName || 'Unknown Component',
          `Rs. ${i.unitPrice?.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          i.quantity?.toString() || '1',
          `Rs. ${i.subtotal?.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        ]);

        if (itemRows.length === 0) {
          itemRows.push(["-", "No parts item details found.", "-", "-", "-"]);
        }

        autoTable(doc, {
          startY: lastY,
          head: [["Item #", "Component Description", "Unit Price", "Qty", "Subtotal"]],
          body: itemRows,
          theme: 'grid',
          headStyles: { fillColor: [100, 110, 120], textColor: [255, 255, 255] },
          columnStyles: {
            2: { halign: 'right' },
            3: { halign: 'center' },
            4: { halign: 'right' }
          },
          margin: { left: 14 }
        });

        lastY = doc.lastAutoTable.finalY + 8;
      });

      // Professional Footer Signatures
      if (lastY > doc.internal.pageSize.height - 35) {
        doc.addPage();
        lastY = 30;
      }

      doc.setDrawColor(200, 200, 200);
      doc.line(14, lastY, 74, lastY);
      doc.line(pageWidth - 74, lastY, pageWidth - 14, lastY);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text("Authorized Audit Signature", 14, lastY + 5);
      doc.text("Customer Verification Signature", pageWidth - 74, lastY + 5);

      // Save File
      doc.save(`Order_History_Statement.pdf`);
    } catch (err) {
      console.error('Failed to generate statement PDF', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetails = async (id) => {
    try {
      setSelectedOrderId(id);
      setIsModalOpen(true);
      setDetailsLoading(true);
      const res = await api.getOrderDetails(id);
      setSelectedOrder(res || null);
    } catch (err) {
      console.error('Failed to load order details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
    setSelectedOrderId(null);
  };

  const getStatusClass = (status) => {
    if (!status) return '';
    const normalized = status.toLowerCase();
    switch (normalized) {
      case 'pending': return 'pending';
      case 'processing': return 'processing';
      case 'shipped': return 'shipped';
      case 'completed':
      case 'delivered': 
        return 'delivered';
      case 'cancelled': return 'cancelled';
      default: return '';
    }
  };

  // Filter and Search logic
  const filteredOrders = orders.filter(order => {
    // Status filter
    if (statusFilter !== 'All') {
      const targetFilter = statusFilter.toLowerCase();
      const orderStatus = (order.status || '').toLowerCase();
      if (targetFilter === 'completed') {
        if (orderStatus !== 'completed' && orderStatus !== 'delivered') return false;
      } else {
        if (orderStatus !== targetFilter) return false;
      }
    }

    // Search query match
    if (searchTerm.trim() !== '') {
      const query = searchTerm.toLowerCase();
      const orderIdMatch = order.id.toString().includes(query);
      const orderNumMatch = (order.orderNumber || '').toLowerCase().includes(query);
      const statusMatch = (order.status || '').toLowerCase().includes(query);
      const productMatch = (order.productNames || []).some(name => name.toLowerCase().includes(query));
      return orderIdMatch || orderNumMatch || statusMatch || productMatch;
    }

    return true;
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  if (loading) {
    return (
      <div className="modal-spinner-wrapper" style={{ minHeight: '400px' }}>
        <div className="modal-loading-spinner" style={{ width: '40px', height: '40px' }}></div>
        <p style={{ color: '#8b949e', marginTop: '12px' }}>Loading your orders history...</p>
      </div>
    );
  }

  return (
    <div className="customer-orders-container">
      {/* Header section */}
      <div className="orders-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1>Purchase Order History</h1>
          <p>View, track, and review invoice details of your past parts purchases.</p>
        </div>
        <button onClick={handleDownloadHistoryPDF} className="professional-pdf-btn">
          <svg className="pdf-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          <span>Download PDF History</span>
        </button>
      </div>

      {/* Control row with search and filter inputs */}
      <div className="orders-control-bar">
        <div className="orders-search-wrapper">
          <svg className="orders-search-icon" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input 
            type="text" 
            placeholder="Search orders by ID or number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="orders-filter-wrapper">
          <label style={{ fontSize: '0.85rem', color: '#8b949e', fontWeight: 600 }}>Filter by Status:</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All Purchases</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Main Table view */}
      <div className="orders-table-wrapper">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Reference Number</th>
              <th>Placed Date</th>
              <th>Items Count</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan="7">
                  <div className="orders-empty-state">
                    <svg fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <circle cx="9" cy="21" r="1" />
                      <circle cx="20" cy="21" r="1" />
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </svg>
                    <h3>No Orders Found</h3>
                    <p>We couldn't find any purchases matching your active search or filter tags.</p>
                  </div>
                </td>
              </tr>
            ) : (
              currentItems.map((order) => (
                <tr key={order.id} onClick={() => handleOpenDetails(order.id)}>
                  <td>
                    <span className="order-id-badge">#{order.id}</span>
                  </td>
                  <td>
                    <span className="order-number-text">{order.orderNumber || 'N/A'}</span>
                  </td>
                  <td>
                    {new Date(order.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </td>
                  <td>
                    <span className="order-items-count">{order.itemCount || 1} {order.itemCount === 1 ? 'part' : 'parts'}</span>
                  </td>
                  <td>
                    <span className="order-amount-cell">Rs. {order.totalAmount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </td>
                  <td>
                    <span className={`status-pill-badge ${getStatusClass(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                    <button 
                      className="btn-view-order-details"
                      onClick={() => handleOpenDetails(order.id)}
                    >
                      <span>Invoice Details</span>
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="orders-pagination">
          <button
            className="pagination-arrow-btn"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          
          {[...Array(totalPages).keys()].map(page => (
            <button
              key={page + 1}
              className={`pagination-num-btn ${currentPage === page + 1 ? 'active' : ''}`}
              onClick={() => setCurrentPage(page + 1)}
            >
              {page + 1}
            </button>
          ))}

          <button
            className="pagination-arrow-btn"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      )}

      {/* Centered Frosted Details Modal Overlay */}
      {isModalOpen && (
        <div className="details-overlay-backdrop" onClick={handleCloseModal}>
          <div className="details-modal-card" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="details-modal-header">
              <h2>
                <svg width="18" height="18" fill="none" stroke="#e04f5f" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                <span>Purchase Invoice Summary</span>
              </h2>
              <button className="btn-close-modal" onClick={handleCloseModal}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Modal Scroll Body */}
            <div className="details-modal-body">
              {detailsLoading ? (
                <div className="modal-spinner-wrapper">
                  <div className="modal-loading-spinner"></div>
                  <p>Retrieving order details from warehouse...</p>
                </div>
              ) : selectedOrder ? (
                <>
                  {/* Meta box grid */}
                  <div className="modal-meta-grid">
                    <div className="meta-info-box">
                      <h4>Order ID & Ref</h4>
                      <p style={{ fontWeight: 700, color: '#fff' }}>#{selectedOrder.id}</p>
                      <p style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#8b949e', marginTop: '2px' }}>
                        {selectedOrder.orderNumber || 'N/A'}
                      </p>
                    </div>
                    <div className="meta-info-box">
                      <h4>Fulfillment Status</h4>
                      <span className={`status-pill-badge ${getStatusClass(selectedOrder.status)}`} style={{ marginTop: '4px' }}>
                        {selectedOrder.status}
                      </span>
                    </div>
                    <div className="meta-info-box">
                      <h4>Order Date & Time</h4>
                      <p>
                        {new Date(selectedOrder.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                      <p style={{ fontSize: '0.78rem', color: '#8b949e', marginTop: '2px' }}>
                        {new Date(selectedOrder.createdAt).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="meta-info-box">
                      <h4>Shipping Address</h4>
                      <p className="meta-address">
                        {selectedOrder.shippingAddress || 'No shipping address registered.'}
                      </p>
                    </div>
                  </div>

                  {/* Notes Segment if present */}
                  {selectedOrder.notes && (
                    <div className="meta-info-box" style={{ marginBottom: '1.5rem', width: '100%' }}>
                      <h4>Delivery Notes / Customer Requests</h4>
                      <p style={{ fontSize: '0.85rem', fontStyle: 'italic', color: '#8b949e', marginTop: '2px' }}>
                        "{selectedOrder.notes}"
                      </p>
                    </div>
                  )}

                  {/* Parts List items */}
                  <div className="modal-section-title">
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M21 8l-9-4-9 4v8l9 4 9-4V8zM12 4v16m-9-12l9 4 9-4" />
                    </svg>
                    <span>Purchased Items</span>
                  </div>

                  <div style={{ background: '#0d1117', border: '1px solid #21262d', borderRadius: '12px', padding: '0.5rem 1rem' }}>
                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                      selectedOrder.items.map((item) => (
                        <div key={item.id} className="modal-part-item-row">
                          <div className="modal-part-img-wrapper">
                            {item.partImage ? (
                              <img src={item.partImage} alt={item.partName} />
                            ) : (
                              <svg width="16" height="16" fill="none" stroke="#8b949e" strokeWidth="2" viewBox="0 0 24 24">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21 15 16 10 5 21" />
                              </svg>
                            )}
                          </div>
                          <div className="modal-part-details">
                            <h5>{item.partName}</h5>
                            <span>Part Code Reference: PRT-{item.id}</span>
                          </div>
                          <div className="modal-part-pricing">
                            <span className="subtotal">Rs. {(item.quantity * item.unitPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            <span className="calculation">Rs. {item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} × {item.quantity}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p style={{ textAlign: 'center', padding: '10px 0', color: '#8b949e', margin: 0, fontSize: '0.88rem' }}>
                        No item records attached to this invoice.
                      </p>
                    )}
                  </div>

                  {/* Cost Sheet Summary */}
                  <div className="modal-cost-sheet">
                    <div className="cost-row">
                      <span>Gross Subtotal</span>
                      <span>Rs. {(selectedOrder.originalAmount || selectedOrder.totalAmount)?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    {selectedOrder.discountAmount > 0 && (
                      <div className="cost-row discount">
                        <span>Loyalty Discount ({selectedOrder.discountAmount > 0 ? '10%' : '0%'})</span>
                        <span>-Rs. {selectedOrder.discountAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    <div className="cost-row total-amount">
                      <span>Total Amount Paid</span>
                      <span className="grand-price">Rs. {selectedOrder.totalAmount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </>
              ) : (
                <p style={{ textAlign: 'center', color: '#f85149' }}>Failed to retrieve this purchase record details.</p>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerOrdersPage;
