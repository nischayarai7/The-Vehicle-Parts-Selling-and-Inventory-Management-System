import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const CustomerServiceHistoryPage = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await api.getMyAppointments();
      // Handle both object and array responses
      const data = res.data || (Array.isArray(res) ? res : []);
      // Filter for completed appointments as service history
      const completedServices = data.filter(a => a.status === 'Completed');
      setServices(completedServices);
    } catch (err) {
      console.error('Failed to load service history:', err);
    } finally {
      setLoading(false);
    }
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = services.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(services.length / itemsPerPage);

  if (loading) {
    return (
      <div className="spinner-wrapper">
        <div className="loading-spinner"></div>
        <p style={{ marginTop: '16px' }}>Loading your service history...</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Service History</h1>
      <p style={{ color: '#888', marginBottom: '24px' }}>View details of your past completed services.</p>

      <div className="large-card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #222' }}>
                <th style={{ textAlign: 'left', padding: '12px', color: '#888' }}>Date</th>
                <th style={{ textAlign: 'left', padding: '12px', color: '#888' }}>Service</th>
                <th style={{ textAlign: 'left', padding: '12px', color: '#888' }}>Vehicle</th>
                <th style={{ textAlign: 'left', padding: '12px', color: '#888' }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                    No completed services found.
                  </td>
                </tr>
              ) : (
                currentItems.map((service) => (
                  <tr key={service.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                    <td style={{ padding: '12px', color: '#ccc' }}>
                      {new Date(service.appointmentDate).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: '#fff' }}>
                      {service.serviceType}
                    </td>
                    <td style={{ padding: '12px', color: '#aaa' }}>
                      {service.vehicleName || 'N/A'}
                    </td>
                    <td style={{ padding: '12px', color: '#888', fontSize: '14px' }}>
                      {service.notes || 'No notes.'}
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

export default CustomerServiceHistoryPage;
