import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import './VendorsManager.css';

const VendorsManager = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentVendor, setCurrentVendor] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    description: '',
    isActive: true
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const data = await api.getVendors();
      setVendors(data);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      alert('Failed to load vendors');
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
      if (currentVendor) {
        await api.updateVendor(currentVendor.id, formData);
        showNotification('Vendor updated successfully');
      } else {
        await api.createVendor(formData);
        showNotification('Vendor created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchVendors();
    } catch (error) {
      console.error('Error saving vendor:', error);
      alert(error.message || 'Failed to save vendor');
    }
  };

  const handleEdit = (vendor) => {
    setCurrentVendor(vendor);
    setFormData({
      name: vendor.name,
      contactPerson: vendor.contactPerson || '',
      email: vendor.email || '',
      phone: vendor.phone || '',
      address: vendor.address || '',
      description: vendor.description || '',
      isActive: vendor.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteVendor(id);
      showNotification('Vendor deleted successfully');
      setDeletingId(null);
      fetchVendors();
    } catch (error) {
      console.error('Error deleting vendor:', error);
      showNotification('Failed to delete vendor', 'error');
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
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      description: '',
      isActive: true
    });
    setCurrentVendor(null);
  };

  if (loading) {
    return <div className="vendors-manager">Loading...</div>;
  }

  return (
    <div className="vendors-manager">
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
      <div className="manager-header">
        <h2>Vendor Directory</h2>
        <button className="btn-add-vendor" onClick={() => { resetForm(); setShowModal(true); }}>
          <span>+</span> New Vendor
        </button>
      </div>

      <div className="vendors-grid">
        {vendors.map(vendor => (
          <div key={vendor.id} className="vendor-card">
            <span className={`vendor-status ${vendor.isActive ? 'status-active' : 'status-inactive'}`}>
              {vendor.isActive ? 'Active' : 'Inactive'}
            </span>
            <div className="vendor-info">
              <h3>{vendor.name}</h3>
              <div className="vendor-contact">
                {vendor.contactPerson && (
                  <div className="contact-item">
                    <i>👤</i> {vendor.contactPerson}
                  </div>
                )}
                {vendor.email && (
                  <div className="contact-item">
                    <i>📧</i> {vendor.email}
                  </div>
                )}
                {vendor.phone && (
                  <div className="contact-item">
                    <i>📞</i> {vendor.phone}
                  </div>
                )}
                {vendor.address && (
                  <div className="contact-item">
                    <i>📍</i> {vendor.address}
                  </div>
                )}
              </div>
            </div>
            <div className="vendor-actions">
              <button className="btn-edit" onClick={() => handleEdit(vendor)}>
                Edit
              </button>
              {deletingId === vendor.id ? (
                <div className="delete-confirm">
                  <button className="btn-confirm" onClick={() => handleDelete(vendor.id)}>Confirm</button>
                  <button className="btn-cancel-small" onClick={() => setDeletingId(null)}>Cancel</button>
                </div>
              ) : (
                <button className="btn-delete" onClick={() => setDeletingId(vendor.id)}>
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{currentVendor ? 'Edit Vendor' : 'Add New Vendor'}</h3>
              <button className="btn-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="vendor-form-horizontal">
              <div className="form-group-clean full-width">
                <label>Vendor Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. Toyota Parts Nepal"
                />
              </div>
              <div className="form-group-clean">
                <label>Contact Person</label>
                <input
                  type="text"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleInputChange}
                  placeholder="Full Name"
                />
              </div>
              <div className="form-group-clean">
                <label>Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="e.g. 123-456-7890"
                />
              </div>
              <div className="form-group-clean">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="vendor@example.com"
                />
              </div>
              <div className="form-group-clean">
                <label>Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="City, Street..."
                />
              </div>
              <div className="form-group-clean full-width">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="2"
                  placeholder="Notes about this vendor..."
                />
              </div>
              <div className="form-group-clean full-width checkbox-inline">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                />
                <label htmlFor="isActive">Active Vendor</label>
              </div>
              <div className="modal-actions-clean full-width">
                <button type="button" className="btn-cancel-clean" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-submit-clean">{currentVendor ? 'Update Vendor' : 'Create Vendor'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorsManager;
