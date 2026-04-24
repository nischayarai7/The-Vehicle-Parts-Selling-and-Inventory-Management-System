import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

const PartsManager = () => {
  const [parts, setParts] = useState([]);

  useEffect(() => {
    loadParts();
  }, []);

  const loadParts = async () => {
    try {
      const data = await api.getAllParts();
      setParts(data);
    } catch (error) {
      console.error("Failed to load parts", error);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Parts Management</h2>
        <button className="btn-primary">Add New Part</button>
      </div>

      <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            <tr>
              <th style={{ padding: '12px 15px', textAlign: 'left', color: '#6b7280' }}>Part Number</th>
              <th style={{ padding: '12px 15px', textAlign: 'left', color: '#6b7280' }}>Name</th>
              <th style={{ padding: '12px 15px', textAlign: 'left', color: '#6b7280' }}>Category</th>
              <th style={{ padding: '12px 15px', textAlign: 'left', color: '#6b7280' }}>Price</th>
              <th style={{ padding: '12px 15px', textAlign: 'left', color: '#6b7280' }}>Stock</th>
              <th style={{ padding: '12px 15px', textAlign: 'right', color: '#6b7280' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {parts.map(part => (
              <tr key={part.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px 15px' }}>{part.partNumber}</td>
                <td style={{ padding: '12px 15px', fontWeight: '500' }}>{part.name}</td>
                <td style={{ padding: '12px 15px' }}>{part.categoryName}</td>
                <td style={{ padding: '12px 15px' }}>Rs. {part.price}</td>
                <td style={{ padding: '12px 15px' }}>
                  <span style={{ 
                    padding: '3px 8px', 
                    borderRadius: '12px', 
                    fontSize: '12px',
                    backgroundColor: part.isLowStock ? '#fee2e2' : '#dcfce7',
                    color: part.isLowStock ? '#991b1b' : '#166534'
                  }}>
                    {part.stockQuantity}
                  </span>
                </td>
                <td style={{ padding: '12px 15px', textAlign: 'right' }}>
                  <button style={{ marginRight: '10px', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}>Edit</button>
                  <button style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
                </td>
              </tr>
            ))}
            {parts.length === 0 && (
              <tr>
                <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>No parts found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PartsManager;
