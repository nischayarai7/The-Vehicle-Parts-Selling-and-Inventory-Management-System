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
  const [formData, setFormData] = useState({
    name: '',
    description: '',
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentCategory) {
        await api.updateCategory(currentCategory.id, formData);
        showNotification('Category updated successfully');
      } else {
        await api.createCategory(formData);
        showNotification('Category created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      showNotification(error.message || 'Failed to save category', 'error');
    }
  };

  const handleEdit = (category) => {
    setCurrentCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      isActive: category.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteCategory(id);
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
      isActive: true
    });
    setCurrentCategory(null);
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
            <span className={`category-status ${category.isActive ? 'status-active' : 'status-inactive'}`}>
              {category.isActive ? 'Active' : 'Inactive'}
            </span>
            <div className="category-info">
              <div className="category-icon-wrapper">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
              </div>
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
                <button type="button" className="btn-cancel-cat" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-submit-cat">{currentCategory ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesManager;
