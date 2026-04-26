import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';

const StaffInvoice = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch order details when the component mounts
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

  // Triggers the browser's print dialog
  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div style={{ color: 'var(--admin-text-muted)' }}>Loading invoice...</div>;
  if (error) return <div style={{ color: 'var(--danger)' }}>{error}</div>;
  if (!order) return <div style={{ color: 'var(--admin-text-muted)' }}>Invoice not found.</div>;

  return (
    <div>
      {/* Header controls - Hidden during printing via CSS classes (if applicable) or simple inline styles */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }} className="no-print">
        <Link to="/staff/pos" className="btn-primary" style={{ background: '#30363d', color: 'white' }}>&larr; Back to POS</Link>
        <button onClick={handlePrint} className="btn-primary" style={{ background: 'var(--success)' }}>🖨️ Print Invoice</button>
      </div>

      {/* Invoice Document Area */}
      <div className="large-card" style={{ background: '#ffffff', color: '#000000', padding: '40px', borderRadius: '8px', maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Invoice Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #eaeaea', paddingBottom: '20px', marginBottom: '20px' }}>
          <div>
            <h1 style={{ margin: 0, color: 'var(--primary)', fontSize: '28px' }}>6IX7EVEN</h1>
            <p style={{ margin: '5px 0 0 0', color: '#666' }}>Auto Parts & Accessories</p>
            <p style={{ margin: 0, color: '#666' }}>123 Garage Street, Auto City</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ margin: 0, fontSize: '24px', color: '#333' }}>INVOICE</h2>
            <p style={{ margin: '5px 0 0 0', fontWeight: 'bold' }}>#{order.orderNumber}</p>
            <p style={{ margin: 0, color: '#666' }}>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Customer Information */}
        <div style={{ marginBottom: '30px' }}>
          <h4 style={{ color: '#333', borderBottom: '1px solid #eaeaea', paddingBottom: '5px', marginBottom: '10px' }}>Billed To:</h4>
          <p style={{ margin: 0, fontWeight: 'bold' }}>{order.customerName}</p>
          <p style={{ margin: 0, color: '#666' }}>{order.customerEmail}</p>
        </div>

        {/* Order Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
          <thead>
            <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #eaeaea' }}>
              <th style={{ padding: '12px', textAlign: 'left', color: '#333' }}>Description</th>
              <th style={{ padding: '12px', textAlign: 'center', color: '#333' }}>Qty</th>
              <th style={{ padding: '12px', textAlign: 'right', color: '#333' }}>Unit Price</th>
              <th style={{ padding: '12px', textAlign: 'right', color: '#333' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid #eaeaea' }}>
                <td style={{ padding: '12px', color: '#444' }}>{item.partName}</td>
                <td style={{ padding: '12px', textAlign: 'center', color: '#444' }}>{item.quantity}</td>
                <td style={{ padding: '12px', textAlign: 'right', color: '#444' }}>${item.unitPrice.toFixed(2)}</td>
                <td style={{ padding: '12px', textAlign: 'right', color: '#444' }}>${item.subtotal.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Invoice Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: '300px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '2px solid #eaeaea' }}>
              <strong style={{ fontSize: '18px', color: '#333' }}>Total:</strong>
              <strong style={{ fontSize: '18px', color: 'var(--success)' }}>${order.totalAmount.toFixed(2)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
              <span style={{ color: '#666' }}>Status:</span>
              <span style={{ fontWeight: 'bold', color: order.status === 'Completed' ? 'var(--success)' : '#f39c12' }}>{order.status}</span>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        {order.notes && (
          <div style={{ marginTop: '40px', padding: '15px', background: '#f8f9fa', borderRadius: '4px' }}>
            <strong style={{ color: '#333' }}>Notes:</strong>
            <p style={{ margin: '5px 0 0 0', color: '#666' }}>{order.notes}</p>
          </div>
        )}

        <div style={{ marginTop: '50px', textAlign: 'center', color: '#888', fontSize: '12px' }}>
          Thank you for your business!
        </div>
      </div>

      {/* CSS to handle print formatting (hides everything outside the invoice card) */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .large-card, .large-card * {
            visibility: visible;
          }
          .large-card {
            position: absolute;
            left: 0;
            top: 0;
            margin: 0;
            padding: 0;
            box-shadow: none;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default StaffInvoice;
