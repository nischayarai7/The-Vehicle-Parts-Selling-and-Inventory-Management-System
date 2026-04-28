import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

const CreatePurchaseInvoice = ({ onClose, onSuccess }) => {
  const [vendors, setVendors] = useState([]);
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    invoiceNumber: `PI-${Date.now().toString().slice(-6)}`,
    vendorId: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    notes: '',
    items: [{ partId: '', quantity: 1, unitPrice: 0 }]
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [vendorsData, partsData] = await Promise.all([
          api.getVendors(),
          api.getAllParts()
        ]);
        setVendors(vendorsData.filter(v => v.isActive));
        setParts(partsData.filter(p => p.isActive));
      } catch (error) {
        console.error('Error loading form data:', error);
        alert('Failed to load vendors or parts');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    
    // If partId changes, try to set the default price from the part
    if (field === 'partId') {
      const selectedPart = parts.find(p => p.id === parseInt(value));
      if (selectedPart) {
        newItems[index].unitPrice = selectedPart.price;
      }
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { partId: '', quantity: 1, unitPrice: 0 }]
    });
  };

  const removeItem = (index) => {
    if (formData.items.length === 1) return;
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.vendorId) {
      alert('Please select a vendor');
      return;
    }

    if (formData.items.some(item => !item.partId || item.quantity <= 0)) {
      alert('Please ensure all items have a part and a valid quantity');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        vendorId: parseInt(formData.vendorId),
        items: formData.items.map(item => ({
          ...item,
          partId: parseInt(item.partId),
          quantity: parseInt(item.quantity),
          unitPrice: parseFloat(item.unitPrice)
        }))
      };
      
      await api.createPurchaseInvoice(payload);
      onSuccess();
    } catch (error) {
      console.error('Error creating purchase invoice:', error);
      alert(error.message || 'Failed to create purchase invoice');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content create-invoice-modal">
        <div className="modal-header">
          <h3>Create Purchase Invoice</h3>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="invoice-form">
          <div className="form-section main-info">
            <div className="form-group-clean">
              <label>Invoice Number *</label>
              <input
                type="text"
                name="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group-clean">
              <label>Vendor *</label>
              <select
                name="vendorId"
                value={formData.vendorId}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Vendor</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group-clean">
              <label>Invoice Date</label>
              <input
                type="date"
                name="invoiceDate"
                value={formData.invoiceDate}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-section items-section">
            <h4>Invoice Items</h4>
            <div className="items-list-header">
              <span className="col-part">Part</span>
              <span className="col-qty">Quantity</span>
              <span className="col-price">Unit Price (Rs.)</span>
              <span className="col-subtotal">Subtotal</span>
              <span className="col-action"></span>
            </div>
            
            <div className="items-list">
              {formData.items.map((item, index) => (
                <div key={index} className="item-row">
                  <div className="col-part">
                    <select
                      value={item.partId}
                      onChange={(e) => handleItemChange(index, 'partId', e.target.value)}
                      required
                    >
                      <option value="">Select Part</option>
                      {parts.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.partNumber})</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-qty">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <div className="col-price">
                    <input
                      type="number"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                  <div className="col-subtotal">
                    Rs. {(item.quantity * item.unitPrice).toLocaleString()}
                  </div>
                  <div className="col-action">
                    <button type="button" className="btn-remove" onClick={() => removeItem(index)} title="Remove item">
                      &times;
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <button type="button" className="btn-add-item" onClick={addItem}>
              + Add Item
            </button>
          </div>

          <div className="form-group-clean full-width">
            <label>Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="2"
              placeholder="Add any internal notes here..."
            />
          </div>

          <div className="invoice-footer">
            <div className="total-display">
              <label>Grand Total:</label>
              <span className="amount">Rs. {calculateTotal().toLocaleString()}</span>
            </div>
            <div className="modal-actions-clean">
              <button type="button" className="btn-cancel-clean" onClick={onClose} disabled={submitting}>Cancel</button>
              <button type="submit" className="btn-submit-clean" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Invoice & Update Stock'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePurchaseInvoice;
