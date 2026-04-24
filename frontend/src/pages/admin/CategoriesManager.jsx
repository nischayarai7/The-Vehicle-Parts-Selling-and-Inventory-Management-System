import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

const CategoriesManager = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (error) {
      console.error("Failed to load categories", error);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Categories Management</h2>
        <button className="btn-primary">Add New Category</button>
      </div>

      <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            <tr>
              <th style={{ padding: '12px 15px', textAlign: 'left', color: '#6b7280', width: '50px' }}>ID</th>
              <th style={{ padding: '12px 15px', textAlign: 'left', color: '#6b7280' }}>Name</th>
              <th style={{ padding: '12px 15px', textAlign: 'left', color: '#6b7280' }}>Description</th>
              <th style={{ padding: '12px 15px', textAlign: 'left', color: '#6b7280' }}>Status</th>
              <th style={{ padding: '12px 15px', textAlign: 'right', color: '#6b7280' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => (
              <tr key={cat.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px 15px' }}>{cat.id}</td>
                <td style={{ padding: '12px 15px', fontWeight: '500' }}>{cat.name}</td>
                <td style={{ padding: '12px 15px', color: '#6b7280' }}>{cat.description || '-'}</td>
                <td style={{ padding: '12px 15px' }}>
                  <span style={{ 
                    padding: '3px 8px', 
                    borderRadius: '12px', 
                    fontSize: '12px',
                    backgroundColor: cat.isActive ? '#dcfce7' : '#f3f4f6',
                    color: cat.isActive ? '#166534' : '#4b5563'
                  }}>
                    {cat.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '12px 15px', textAlign: 'right' }}>
                  <button style={{ marginRight: '10px', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}>Edit</button>
                  <button style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>No categories found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CategoriesManager;
