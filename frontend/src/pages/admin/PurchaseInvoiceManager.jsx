import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../../services/api';
import CreatePurchaseInvoice from './CreatePurchaseInvoice';
import './PurchaseInvoiceManager.css';

const PurchaseInvoiceManager = () => {
  const context = useOutletContext() || {};
  const searchTerm = context.searchTerm || '';
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const data = await api.getPurchaseInvoices();
      setInvoices(data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      showNotification('Failed to load purchase invoices', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (id) => {
    try {
      const data = await api.getPurchaseInvoiceDetails(id);
      setSelectedInvoice(data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching invoice details:', error);
      showNotification('Failed to load invoice details', 'error');
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredInvoices = invoices.filter(inv => {
    const search = searchTerm.toLowerCase();
    return (
      inv.invoiceNumber.toLowerCase().includes(search) ||
      inv.vendorName.toLowerCase().includes(search) ||
      (inv.notes && inv.notes.toLowerCase().includes(search))
    );
  });

  if (loading) {
    return <div className="purchase-manager">Loading...</div>;
  }

  return (
    <div className="purchase-manager">
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <div className="manager-header">
        <div>
          <h2>Purchase Invoices</h2>
          <p className="subtitle">Manage vendor purchases and inventory restock.</p>
        </div>
        <button className="btn-add-purchase" onClick={() => setShowCreateModal(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Create Invoice
        </button>
      </div>

      <div className="invoice-table-container">
        <table className="invoice-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Vendor</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length > 0 ? (
              filteredInvoices.map(invoice => (
                <tr key={invoice.id}>
                  <td className="invoice-num">{invoice.invoiceNumber}</td>
                  <td>{invoice.vendorName}</td>
                  <td>{new Date(invoice.invoiceDate).toLocaleDateString()}</td>
                  <td className="amount">Rs. {invoice.totalAmount.toLocaleString()}</td>
                  <td className="notes">{invoice.notes || '-'}</td>
                  <td>
                    <button className="btn-view" onClick={() => handleViewDetails(invoice.id)}>
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="no-data">No purchase invoices found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreatePurchaseInvoice 
          onClose={() => setShowCreateModal(false)} 
          onSuccess={() => {
            setShowCreateModal(false);
            fetchInvoices();
            showNotification('Purchase invoice created and stock updated!');
          }} 
        />
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedInvoice && (
        <div className="modal-overlay">
          <div className="modal-content invoice-details-modal">
            <div className="modal-header">
              <h3>Invoice Details: {selectedInvoice.invoiceNumber}</h3>
              <button className="btn-close" onClick={() => setShowDetailsModal(false)}>&times;</button>
            </div>
            <div className="invoice-details-info">
              <div className="info-grid">
                <div className="info-item">
                  <label>Vendor:</label>
                  <span>{selectedInvoice.vendorName}</span>
                </div>
                <div className="info-item">
                  <label>Date:</label>
                  <span>{new Date(selectedInvoice.invoiceDate).toLocaleDateString()}</span>
                </div>
                <div className="info-item">
                  <label>Total Amount:</label>
                  <span className="total">Rs. {selectedInvoice.totalAmount.toLocaleString()}</span>
                </div>
              </div>
              {selectedInvoice.notes && (
                <div className="info-notes">
                  <label>Notes:</label>
                  <p>{selectedInvoice.notes}</p>
                </div>
              )}
            </div>
            
            <div className="items-table-container">
              <h4>Invoice Items</h4>
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Part Name</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items.map(item => (
                    <tr key={item.id}>
                      <td>{item.partName}</td>
                      <td>{item.quantity}</td>
                      <td>Rs. {item.unitPrice.toLocaleString()}</td>
                      <td>Rs. {item.subtotal.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="modal-actions">
              <button className="btn-close-modal" onClick={() => setShowDetailsModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseInvoiceManager;
