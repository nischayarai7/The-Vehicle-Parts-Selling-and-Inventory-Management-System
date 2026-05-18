import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../../services/api';
import './CategoriesManager.css';

const CategoriesManager = () => {
  const context = useOutletContext() || {};
  const searchTerm = context.searchTerm || '';
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [notification, setNotification] = useState(null);
  
  // Image Upload States
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    isActive: true
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      showNotification('Failed to load categories', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      setSelectedImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = async () => {
    // 1. If it's a local unsaved blob preview, just clear it locally
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
      setSelectedImageFile(null);
      setImagePreview('');
      setFormData({
        ...formData,
        imageUrl: ''
      });
      return;
    }

    // 2. If it's an uploaded Cloudinary URL, delete it from Cloudinary instantly
    if (formData.imageUrl) {
      setUploadingImage(true);
      try {
        await api.deleteCategoryImage(formData.imageUrl);
        
        const updatedPayload = {
          ...formData,
          imageUrl: ''
        };

        // If editing an existing category, immediately save to DB so they stay in perfect sync
        if (currentCategory) {
          await api.updateCategory(currentCategory.id, updatedPayload);
          fetchCategories();
        }

        setFormData(updatedPayload);
        setImagePreview('');
      } catch (error) {
        console.error('Error deleting image:', error);
        showNotification('Failed to delete image from Cloudinary', 'error');
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploadingImage(true);
    try {
      let finalImageUrl = formData.imageUrl;

      // 1. Upload file first if selected
      if (selectedImageFile) {
        const uploadResult = await api.uploadCategoryImage(selectedImageFile);
        finalImageUrl = uploadResult.url;
      }

      const categoryPayload = {
        ...formData,
        imageUrl: finalImageUrl
      };

      if (currentCategory) {
        await api.updateCategory(currentCategory.id, categoryPayload);
        showNotification('Category updated successfully');
      } else {
        await api.createCategory(categoryPayload);
        showNotification('Category created successfully');
      }
      
      // Clean up object URL preview
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      
      setShowModal(false);
      resetForm();
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      showNotification(error.message || 'Failed to save category', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEdit = (category) => {
    setCurrentCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      imageUrl: category.imageUrl || '',
      isActive: category.isActive
    });
    setImagePreview(category.imageUrl || '');
    setSelectedImageFile(null);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    try {
      const categoryToDelete = categories.find(c => c.id === id);
      await api.deleteCategory(id);
      
      // Clean up the image from Cloudinary in the background
      if (categoryToDelete && categoryToDelete.imageUrl) {
        api.deleteCategoryImage(categoryToDelete.imageUrl).catch(err => 
          console.error("Failed to delete category image from Cloudinary:", err)
        );
      }

      showNotification('Category deleted successfully');
      setDeletingId(null);
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      showNotification('Failed to delete category. It might be linked to parts.', 'error');
      setDeletingId(null);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      imageUrl: '',
      isActive: true
    });
    setCurrentCategory(null);
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview('');
    setSelectedImageFile(null);
  };

  const filteredCategories = categories.filter(c => {
    const search = searchTerm.toLowerCase();
    return (
      c.name?.toLowerCase().includes(search) ||
      c.description?.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return <div className="categories-manager">Loading...</div>;
  }

  return (
    <div className="categories-manager">
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
      
      <div className="manager-header">
        <div>
          <h2>Product Categories</h2>
          <p className="subtitle">Manage part groups and organization.</p>
        </div>
        <button className="btn-add-category" onClick={() => { resetForm(); setShowModal(true); }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          New Category
        </button>
      </div>

      <div className="categories-grid">
        {filteredCategories.map(category => (
          <div key={category.id} className="category-card">
            <div className="category-card-banner">
              {category.imageUrl ? (
                <img 
                  src={category.imageUrl} 
                  alt={category.name} 
                  className="category-banner-img" 
                />
              ) : (
                <div className="category-banner-placeholder">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
                </div>
              )}
              <span className={`category-status ${category.isActive ? 'status-active' : 'status-inactive'}`}>
                {category.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="category-card-content">
              <div className="category-info">
                <h3>{category.name}</h3>
                <p className="category-desc">{category.description || 'No description provided.'}</p>
              </div>
              <div className="category-actions">
                <button className="btn-edit-cat" onClick={() => handleEdit(category)}>
                  Edit
                </button>
                {deletingId === category.id ? (
                  <div className="delete-confirm">
                    <button className="btn-confirm-cat" onClick={() => handleDelete(category.id)}>Yes</button>
                    <button className="btn-cancel-small-cat" onClick={() => setDeletingId(null)}>No</button>
                  </div>
                ) : (
                  <button className="btn-delete-cat" onClick={() => setDeletingId(category.id)}>
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {filteredCategories.length === 0 && (
          <div className="no-results-full">
            <p>No categories match your search.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content-cat">
            <div className="modal-header">
              <h3>{currentCategory ? 'Edit Category' : 'Create Category'}</h3>
              <button className="btn-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="category-form">
              <div className="form-group-cat">
                <label>Category Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. Braking System"
                />
              </div>
              <div className="form-group-cat">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="What parts are in this category?"
                />
              </div>
              <div className="form-group-cat">
                <label>Category Image</label>
                <div className="image-upload-container">
                  {imagePreview ? (
                    <div className="image-preview">
                      <img src={imagePreview} alt="Category preview" />
                      <button 
                        type="button" 
                        className="btn-remove-image" 
                        onClick={handleRemoveImage}
                        title="Remove image"
                      >
                        &times;
                      </button>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileChange} 
                        className="file-input-hidden" 
                        id="category-image-upload"
                      />
                      <label htmlFor="category-image-upload" className="btn-upload">
                        Choose Category Image
                      </label>
                    </div>
                  )}
                </div>
              </div>
              <div className="form-group-cat checkbox-group">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                />
                <label htmlFor="isActive">Show this category in storefront</label>
              </div>
              <div className="modal-actions-cat">
                <button type="button" className="btn-cancel-cat" onClick={() => setShowModal(false)} disabled={uploadingImage}>Cancel</button>
                <button type="submit" className="btn-submit-cat" disabled={uploadingImage}>
                  {uploadingImage ? 'Saving...' : currentCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesManager;
