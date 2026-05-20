import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../../services/api';
import CreatePurchaseInvoice from './CreatePurchaseInvoice';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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

  const handleDownloadInvoicePDF = () => {
    if (!selectedInvoice) return;

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;

      // Header Banner
      doc.setFillColor(30, 41, 59); // Slate Dark Blue Theme matching Admin Dashboard
      doc.rect(0, 0, pageWidth, 40, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text("6IX7EVEN AUTO PARTS", 14, 18);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text("VENDOR PURCHASE INVOICE RECORD", 14, 30);

      // Metadata right-aligned
      doc.setFontSize(9);
      doc.text(`INVOICE NO: ${selectedInvoice.invoiceNumber}`, pageWidth - 90, 16);
      doc.text(`VENDOR: ${selectedInvoice.vendorName.toUpperCase()}`, pageWidth - 90, 23);
      doc.text(`DATE: ${new Date(selectedInvoice.invoiceDate).toLocaleDateString()}`, pageWidth - 90, 30);

      doc.setTextColor(30, 41, 59);

      // 1. Transaction Info
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text("1. Purchase & Stocking Details", 14, 52);

      const summaryRows = [
        ["Vendor Name", selectedInvoice.vendorName],
        ["Invoice Date", new Date(selectedInvoice.invoiceDate).toLocaleDateString()],
        ["Fulfillment Type", "Inventory Restock / Purchase"]
      ];

      autoTable(doc, {
        startY: 56,
        head: [["Parameter", "Details"]],
        body: summaryRows,
        theme: 'grid',
        headStyles: { fillColor: [46, 175, 80], textColor: [255, 255, 255] },
        columnStyles: {
          0: { fontStyle: 'bold', width: 60 },
          1: { halign: 'left' }
        }
      });

      let lastY = doc.lastAutoTable.finalY + 12;

      // 2. Purchased Items Breakdown
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text("2. Restocked Components Breakdown", 14, lastY);

      const itemHeaders = [["Item #", "Component Description", "Unit Cost", "Qty Purchased", "Subtotal"]];
      const itemBody = selectedInvoice.items.map((item, idx) => [
        `#${idx + 1}`,
        item.partName,
        `Rs. ${item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        item.quantity.toString(),
        `Rs. ${item.subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      ]);

      autoTable(doc, {
        startY: lastY + 4,
        head: itemHeaders,
        body: itemBody,
        theme: 'striped',
        headStyles: { fillColor: [54, 69, 79], textColor: [255, 255, 255] },
        columnStyles: {
          2: { halign: 'right' },
          3: { halign: 'center' },
          4: { halign: 'right' }
        }
      });

      lastY = doc.lastAutoTable.finalY + 10;

      // 3. Totals Block
      const totalRows = [
        ["Total Purchase Settle Amount:", `Rs. ${selectedInvoice.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`]
      ];

      autoTable(doc, {
        startY: lastY,
        body: totalRows,
        theme: 'plain',
        columnStyles: {
          0: { fontStyle: 'bold', halign: 'right', width: pageWidth - 70 },
          1: { fontStyle: 'bold', halign: 'right', textColor: [46, 175, 80] }
        }
      });

      if (selectedInvoice.notes) {
        lastY = doc.lastAutoTable.finalY + 10;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text("Purchase Memo / Notes:", 14, lastY);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(9);
        doc.text(selectedInvoice.notes, 14, lastY + 5);
      }

      // Signature line
      lastY = doc.lastAutoTable.finalY + 25;
      doc.setDrawColor(200, 200, 200);
      doc.line(14, lastY, 74, lastY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text("Authorized Procurement Officer", 14, lastY + 4);

      doc.save(`Purchase_Invoice_${selectedInvoice.invoiceNumber}.pdf`);
      showNotification('Invoice PDF downloaded successfully!');
    } catch (err) {
      console.error("Failed to generate purchase invoice PDF:", err);
      showNotification('Failed to generate PDF', 'error');
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const search = searchTerm.toLowerCase();
    return (
      inv.invoiceNumber.toLowerCase().includes(search) ||
      inv.vendorName.toLowerCase().includes(search) ||
      (inv.notes && inv.notes.toLowerCase().includes(search))
    );
  });

  return (
    <div className="purchase-manager">
      {notification && (
        <div className={`notification-toast ${notification.type}`}>
          <div className="toast-glow"></div>
          <span className="toast-icon">
            {notification.type === 'success' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4caf50" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f34e4e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            )}
          </span>
          <div className="toast-message">{notification.message}</div>
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
            
            <div className="modal-actions" style={{ gap: '1rem' }}>
              <button onClick={handleDownloadInvoicePDF} className="professional-pdf-btn">
                <svg className="pdf-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                <span>Download Invoice PDF</span>
              </button>
              <button className="btn-close-details" onClick={() => setShowDetailsModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseInvoiceManager;
