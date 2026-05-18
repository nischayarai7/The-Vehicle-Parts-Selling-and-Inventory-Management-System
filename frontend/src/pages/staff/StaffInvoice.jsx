import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import './StaffInvoice.css';

const StaffInvoice = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null); // { type: 'success'|'error', message: string }

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await api.getStaffOrderDetails(id);
        setOrder(data);
      } catch (err) {
        setError(err.message || 'Failed to load invoice details.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = async () => {
    setSendingEmail(true);
    setEmailStatus(null);
    try {
      await api.sendStaffOrderInvoice(id);
      setEmailStatus({ 
        type: 'success', 
        message: `Invoice successfully dispatched to ${order.customerEmail || 'the registered email'}.` 
      });
      // Auto-clear message
      setTimeout(() => setEmailStatus(null), 5000);
    } catch (err) {
      setEmailStatus({ 
        type: 'error', 
        message: err.message || 'Failed to dispatch email invoice.' 
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 2
    }).format(amount).replace('NPR', 'Rs.');
  };

  if (loading) {
    return (
      <div className="invoice-page-container">
        <div style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: '50px' }}>
          <svg className="refresh-icon-svg spinning" style={{ width: '24px', height: '24px', marginBottom: '12px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          <p>Auditing transaction ledger...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="invoice-page-container">
        <div style={{ color: '#e04f5f', textAlign: 'center', padding: '50px', background: '#22252d', borderRadius: '8px' }}>
          <h3>⚠️ Retrieval Failed</h3>
          <p>{error}</p>
          <Link to="/staff/pos" className="btn-invoice-action outline-slate" style={{ marginTop: '15px' }}>Back to POS</Link>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="invoice-page-container">
        <div style={{ color: 'var(--admin-text-muted)', textAlign: 'center', padding: '50px' }}>
          <h3>Invoice Not Found</h3>
          <p>The requested order reference could not be fetched.</p>
          <Link to="/staff/pos" className="btn-invoice-action outline-slate" style={{ marginTop: '15px' }}>Back to POS</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="invoice-page-container">
      {/* Toast Alert */}
      {emailStatus && (
        <div className={`invoice-toast ${emailStatus.type} no-print`}>
          <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            {emailStatus.type === 'success' ? (
              <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>
            ) : (
              <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>
            )}
          </svg>
          <span>{emailStatus.message}</span>
        </div>
      )}

      {/* Top Action controls header */}
      <div className="invoice-controls-header no-print">
        <div className="invoice-actions-left">
          <Link to="/staff/dashboard" className="btn-invoice-action outline-slate">
            <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Done & Exit
          </Link>
          <Link to="/staff/pos" className="btn-invoice-action primary-red">
            <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Transaction
          </Link>
        </div>
        
        <div className="invoice-actions-right">
          <button 
            onClick={handleSendEmail} 
            disabled={sendingEmail}
            className="btn-invoice-action primary-blue"
          >
            {sendingEmail ? (
              <>
                <svg className="refresh-icon-svg spinning" style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>
                Sending Email...
              </>
            ) : (
              <>
                <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                Email Invoice
              </>
            )}
          </button>

          <button onClick={handlePrint} className="btn-invoice-action success-green">
            <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Print Invoice
          </button>
        </div>
      </div>

      {/* Invoice Document Card */}
      <div className="invoice-document-card">
        
        {/* Invoice Top Brand Header */}
        <div className="invoice-brand-row">
          <div className="invoice-logo-block">
            <h1>6IX7EVEN<span>.</span></h1>
            <p>Auto Parts & Accessories</p>
            <p>123 Garage Street, Auto City</p>
            <p>Phone: +977 980-123456</p>
          </div>
          <div className="invoice-meta-block">
            <h2>INVOICE</h2>
            <p className="invoice-order-number">#{order.orderNumber}</p>
            <p className="invoice-date">Date: {new Date(order.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</p>
          </div>
        </div>

        {/* Customer & Staff Billing Info */}
        <div className="invoice-billing-grid">
          <div>
            <h4 className="billing-section-title">Billed To:</h4>
            <p className="billing-name">{order.customerName}</p>
            <p className="billing-detail">{order.customerEmail}</p>
            <p className="billing-detail">Client Account Record</p>
          </div>
          <div>
            <h4 className="billing-section-title">Billed By (Staff):</h4>
            <p className="billing-name">{order.createdByName || 'Storefront'}</p>
            <p className="billing-detail">6ix7even Authorized Representative</p>
            <p className="billing-detail">Staff ID: #{order.createdByName ? 'Verified' : 'System'}</p>
          </div>
        </div>

        {/* Order Items Table */}
        <table className="invoice-items-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Description</th>
              <th style={{ textAlign: 'center', width: '80px' }}>Qty</th>
              <th style={{ textAlign: 'right', width: '120px' }}>Unit Price</th>
              <th style={{ textAlign: 'right', width: '140px' }}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map(item => (
              <tr key={item.id}>
                <td style={{ fontWeight: '600', color: '#0f172a' }}>{item.partName}</td>
                <td style={{ textAlign: 'center', fontWeight: '500' }}>{item.quantity}</td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: '500' }}>{formatCurrency(item.unitPrice)}</td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: '700', color: '#0f172a' }}>{formatCurrency(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Invoice Totals */}
        <div className="invoice-totals-wrapper">
          <div className="invoice-totals-box">
            <div className="totals-row">
              <span>Payment Status</span>
              <span className={`status-badge-invoice ${order.status.toLowerCase()}`}>
                {order.status}
              </span>
            </div>
            <div className="totals-row">
              <span>Subtotal Amount</span>
              <span>{formatCurrency(order.originalAmount > 0 ? order.originalAmount : order.totalAmount)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="totals-row" style={{ color: '#2ea043', fontWeight: '600' }}>
                <span>Loyalty Discount Applied</span>
                <strong>-{formatCurrency(order.discountAmount)}</strong>
              </div>
            )}
            <div className="totals-row grand-total">
              <span>Grand Total</span>
              <strong>{formatCurrency(order.totalAmount)}</strong>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        {order.notes && (
          <div className="invoice-notes-block">
            <strong>Order Notes / Instructions:</strong>
            <p>{order.notes}</p>
          </div>
        )}

        <div className="invoice-footer-thankyou">
          Thank you for choosing 6ix7even Auto Parts. Your trusted automotive partner!
        </div>
      </div>
    </div>
  );
};

export default StaffInvoice;
