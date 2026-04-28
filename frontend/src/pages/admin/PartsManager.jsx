import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../../services/api';
import './PartsManager.css';

const PartsManager = () => {
  const context = useOutletContext() || {};
  const searchTerm = context.searchTerm || '';
  const [parts, setParts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentPart, setCurrentPart] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [notification, setNotification] = useState(null);
  
  const [formData, setFormData] = useState({
    partNumber: '',
    name: '',
    description: '',
    price: 0,
    stockQuantity: 0,
    reorderLevel: 5,
    categoryId: '',
    brand: '',
    condition: 'New',
    imageUrl: '',
    isActive: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [partsData, categoriesData] = await Promise.all([
        api.getAllParts(),
        api.getCategories()
      ]);
      setParts(partsData);
      setCategories(categoriesData.filter(c => c.isActive));
    } catch (error) {
      console.error('Error fetching parts/categories:', error);
      showNotification('Failed to load parts data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        categoryId: parseInt(formData.categoryId),
        price: parseFloat(formData.price),
        stockQuantity: parseInt(formData.stockQuantity),
        reorderLevel: parseInt(formData.reorderLevel)
      };

      if (currentPart) {
        await api.updatePart(currentPart.id, payload);
        showNotification('Part updated successfully');
      } else {
        await api.createPart(payload);
        showNotification('Part created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving part:', error);
      showNotification(error.message || 'Failed to save part', 'error');
    }
  };

  const handleEdit = (part) => {
    setCurrentPart(part);
    setFormData({
      partNumber: part.partNumber,
      name: part.name,
      description: part.description || '',
      price: part.price,
      stockQuantity: part.stockQuantity,
      reorderLevel: part.reorderLevel,
      categoryId: part.categoryId.toString(),
      brand: part.brand || '',
      condition: part.condition || 'New',
      imageUrl: part.imageUrl || '',
      isActive: part.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.deletePart(id);
      showNotification('Part deleted successfully');
      setDeletingId(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting part:', error);
      showNotification('Failed to delete part. It might be linked to orders or invoices.', 'error');
      setDeletingId(null);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const resetForm = () => {
    setFormData({
      partNumber: '',
      name: '',
      description: '',
      price: 0,
      stockQuantity: 0,
      reorderLevel: 5,
      categoryId: '',
      brand: '',
      condition: 'New',
      imageUrl: '',
      isActive: true
    });
    setCurrentPart(null);
  };

  const filteredParts = parts.filter(p => {
    const search = searchTerm.toLowerCase();
    return (
      p.name?.toLowerCase().includes(search) ||
      p.partNumber?.toLowerCase().includes(search) ||
      p.categoryName?.toLowerCase().includes(search) ||
      p.brand?.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return <div className="parts-manager">Loading inventory...</div>;
  }

  return (
    <div className="parts-manager">
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="manager-header">
        <div>
          <h2>Parts Inventory</h2>
          <p className="subtitle">Manage vehicle components, pricing and stock levels.</p>
        </div>
        <button className="btn-add-part" onClick={() => { resetForm(); setShowModal(true); }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Add New Part
        </button>
      </div>

      <div className="parts-grid">
        {filteredParts.map(part => (
          <div key={part.id} className="part-card">
            <div className="part-card-image">
              {part.imageUrl ? (
                <img src={part.imageUrl} alt={part.name} />
              ) : (
                <div className="part-placeholder">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                </div>
              )}
              <span className={`part-condition ${part.condition?.toLowerCase()}`}>{part.condition}</span>
            </div>
            
            <div className="part-card-content">
              <div className="part-header">
                <span className="part-sku">{part.partNumber}</span>
                <span className={`part-status-dot ${part.isActive ? 'active' : 'inactive'}`} title={part.isActive ? 'Active' : 'Inactive'}></span>
              </div>
              <h3>{part.name}</h3>
              <p className="part-cat-brand">{part.categoryName} • {part.brand || 'No Brand'}</p>
              
              <div className="part-stats">
                <div className="stat-item">
                  <span className="stat-label">Price</span>
                  <span className="stat-value">Rs. {part.price.toLocaleString()}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Stock</span>
                  <span className={`stat-value stock-num ${part.stockQuantity <= part.reorderLevel ? 'low' : ''}`}>
                    {part.stockQuantity}
                  </span>
                </div>
              </div>

              <div className="part-actions">
                <button className="btn-edit-part" onClick={() => handleEdit(part)}>
                  Edit
                </button>
                {deletingId === part.id ? (
                  <div className="delete-confirm">
                    <button className="btn-confirm-part" onClick={() => handleDelete(part.id)}>Yes</button>
                    <button className="btn-cancel-small-part" onClick={() => setDeletingId(null)}>No</button>
                  </div>
                ) : (
                  <button className="btn-delete-part" onClick={() => setDeletingId(part.id)}>
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredParts.length === 0 && (
          <div className="no-results-full">
            <p>No parts match your search or filters.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content-part">
            <div className="modal-header">
              <h3>{currentPart ? 'Edit Part' : 'Add New Part'}</h3>
              <button className="btn-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="part-form">
              <div className="form-row">
                <div className="form-group-part">
                  <label>Part Number (SKU) *</label>
                  <input
                    type="text"
                    name="partNumber"
                    value={formData.partNumber}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. TOY-BRAKE-001"
                  />
                </div>
                <div className="form-group-part">
                  <label>Part Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. Front Brake Pads"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group-part">
                  <label>Category *</label>
                  <select
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group-part">
                  <label>Brand</label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    placeholder="e.g. Brembo"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group-part">
                  <label>Price (Rs.) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="form-group-part">
                  <label>Stock Quantity *</label>
                  <input
                    type="number"
                    name="stockQuantity"
                    value={formData.stockQuantity}
                    onChange={handleInputChange}
                    required
                    min="0"
                  />
                </div>
                <div className="form-group-part">
                  <label>Reorder Level</label>
                  <input
                    type="number"
                    name="reorderLevel"
                    value={formData.reorderLevel}
                    onChange={handleInputChange}
                    required
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group-part">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="2"
                  placeholder="Technical specifications, features..."
                />
              </div>

              <div className="form-row">
                <div className="form-group-part">
                  <label>Condition</label>
                  <select name="condition" value={formData.condition} onChange={handleInputChange}>
                    <option value="New">New</option>
                    <option value="Used">Used</option>
                    <option value="Refurbished">Refurbished</option>
                  </select>
                </div>
                <div className="form-group-part">
                  <label>Image URL</label>
                  <input
                    type="text"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>

              <div className="form-group-part checkbox-group">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                />
                <label htmlFor="isActive">Listed for Sale</label>
              </div>

              <div className="modal-actions-part">
                <button type="button" className="btn-cancel-part" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-submit-part">{currentPart ? 'Update Part' : 'Add Part'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartsManager;
