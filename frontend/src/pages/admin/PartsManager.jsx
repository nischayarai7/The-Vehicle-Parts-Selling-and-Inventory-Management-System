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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [localPreview, setLocalPreview] = useState(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  
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

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show local preview immediately and store file for later upload
    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);
    setSelectedImageFile(file);
    // Clear any previously uploaded imageUrl to signify we want to use the new file
    setFormData(prev => ({ ...prev, imageUrl: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let finalImageUrl = formData.imageUrl;

      if (selectedImageFile) {
        setUploadingImage(true);
        const response = await api.uploadPartImage(selectedImageFile);
        finalImageUrl = response.url;
        setUploadingImage(false);
      }

      const payload = {
        ...formData,
        imageUrl: finalImageUrl,
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
    setLocalPreview(null);
    setSelectedImageFile(null);
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

  // Pagination Logic
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentParts = filteredParts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredParts.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    const container = document.querySelector('.parts-manager');
    if (container) {
      container.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      if (currentPage <= 2) {
        end = 4;
      } else if (currentPage >= totalPages - 1) {
        start = totalPages - 3;
      }
      
      if (start > 2) {
        pages.push('...');
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < totalPages - 1) {
        pages.push('...');
      }
      
      pages.push(totalPages);
    }
    return pages;
  };

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
        {currentParts.map(part => (
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

      {/* Pagination Controls */}
      {filteredParts.length > 0 && totalPages > 1 && (
        <div className="pagination-container">
          <div className="pagination-info">
            Showing <span>{indexOfFirstItem + 1}</span> to <span>{Math.min(indexOfLastItem, filteredParts.length)}</span> of <span>{filteredParts.length}</span> parts
          </div>
          <div className="pagination-controls">
            <button 
              className="btn-pagination btn-pagination-nav" 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
              Prev
            </button>
            
            {getPageNumbers().map((page, idx) => (
              page === '...' ? (
                <span key={`ellipse-${idx}`} className="pagination-ellipse" style={{ color: 'var(--admin-text-muted, #9ea4b0)', padding: '0 0.25rem' }}>...</span>
              ) : (
                <button 
                  key={`page-${page}`} 
                  className={`btn-pagination ${currentPage === page ? 'active' : ''}`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              )
            ))}
            
            <button 
              className="btn-pagination btn-pagination-nav" 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        </div>
      )}

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
                  <label>Part Image</label>
                  <div className="image-upload-container">
                    {(formData.imageUrl || localPreview) && (
                      <div className="image-preview">
                        <img src={localPreview || formData.imageUrl} alt="Part preview" style={{ opacity: uploadingImage ? 0.5 : 1 }} />
                        {!uploadingImage && (
                          <button 
                            type="button" 
                            className="btn-remove-image"
                            onClick={() => {
                              setFormData({ ...formData, imageUrl: '' });
                              setLocalPreview(null);
                              setSelectedImageFile(null);
                            }}
                          >
                            &times;
                          </button>
                        )}
                        {uploadingImage && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.7)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>Uploading...</div>}
                      </div>
                    )}
                    {!(formData.imageUrl || localPreview) && (
                      <div className="upload-placeholder">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                          id="partImageUpload"
                          className="file-input-hidden"
                        />
                        <label htmlFor="partImageUpload" className={`btn-upload ${uploadingImage ? 'uploading' : ''}`}>
                          {uploadingImage ? 'Uploading...' : 'Upload Photo'}
                        </label>
                      </div>
                    )}
                  </div>
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
                <button type="button" className="btn-cancel-part" onClick={() => setShowModal(false)} disabled={uploadingImage}>Cancel</button>
                <button type="submit" className="btn-submit-part" disabled={uploadingImage}>
                  {uploadingImage ? 'Uploading Image...' : (currentPart ? 'Update Part' : 'Add Part')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartsManager;
