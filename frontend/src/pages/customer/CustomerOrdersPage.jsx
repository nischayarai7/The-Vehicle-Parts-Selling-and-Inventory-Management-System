import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

const CustomerOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await api.getMyOrders();
      setOrders(data || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = orders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(orders.length / itemsPerPage);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return '#faad14';
      case 'Processing': return '#1890ff';
      case 'Shipped': return '#52c41a';
      case 'Delivered': return '#52c41a';
      case 'Cancelled': return '#ff4d4f';
      default: return '#888';
    }
  };

  if (loading) {
    return (
      <div className="spinner-wrapper">
        <div className="loading-spinner"></div>
        <p style={{ marginTop: '16px' }}>Loading your orders...</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Purchase Order History</h1>
      <p style={{ color: '#888', marginBottom: '24px' }}>View and track your past part purchases.</p>

      <div className="large-card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #222' }}>
                <th style={{ textAlign: 'left', padding: '12px', color: '#888' }}>Order ID</th>
                <th style={{ textAlign: 'left', padding: '12px', color: '#888' }}>Date</th>
                <th style={{ textAlign: 'left', padding: '12px', color: '#888' }}>Total</th>
                <th style={{ textAlign: 'left', padding: '12px', color: '#888' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                    No orders found.
                  </td>
                </tr>
              ) : (
                currentItems.map((order) => (
                  <tr key={order.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>#{order.id}</td>
                    <td style={{ padding: '12px', color: '#ccc' }}>
                      {new Date(order.createdAt || order.orderDate).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px', color: '#fff' }}>
                      ${order.totalAmount?.toFixed(2) || '0.00'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '12px', 
                        fontSize: '12px', 
                        fontWeight: 'bold',
                        color: '#fff',
                        background: getStatusColor(order.status)
                      }}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              style={{
                padding: '6px 12px',
                background: '#0d1117',
                border: '1px solid #2f363d',
                color: currentPage === 1 ? '#444' : '#fff',
                borderRadius: '4px',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Previous
            </button>
            
            {[...Array(totalPages).keys()].map(page => (
              <button
                key={page + 1}
                onClick={() => setCurrentPage(page + 1)}
                style={{
                  padding: '6px 12px',
                  background: currentPage === page + 1 ? '#1890ff' : '#0d1117',
                  border: `1px solid ${currentPage === page + 1 ? '#1890ff' : '#2f363d'}`,
                  color: '#fff',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {page + 1}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              style={{
                padding: '6px 12px',
                background: '#0d1117',
                border: '1px solid #2f363d',
                color: currentPage === totalPages ? '#444' : '#fff',
                borderRadius: '4px',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerOrdersPage;
