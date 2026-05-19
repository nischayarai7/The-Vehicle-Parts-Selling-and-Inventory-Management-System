import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './CheckoutPage.css';

function CheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { cart, cartSubtotal, discountApplied, cartTotal, loyaltyThreshold, loyaltyRate, clearCart, showToast } = useCart();

  const partIdParam = searchParams.get('partId');
  const quantityParam = parseInt(searchParams.get('quantity') || '1', 10);

  // Checkout items state
  const [checkoutItems, setCheckoutItems] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);

  // Form fields
  const [shippingAddress, setShippingAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Online'); // Default to Paynow (Online)


  useEffect(() => {
    // Scroll to top on load
    window.scrollTo(0, 0);

    const initCheckout = async () => {
      // 1. Check authentication
      if (!isAuthenticated) {
        showToast('Please login to continue with checkout.', 'error');
        // Redirect to login, but save the current search string to redirect back
        const redirectPath = partIdParam 
          ? `/login?redirect=/checkout?partId=${partIdParam}&quantity=${quantityParam}`
          : '/login?redirect=/checkout';
        navigate(redirectPath);
        return;
      }

      // 2. Load checkout items
      if (partIdParam) {
        // Direct Buy - single item from query params
        try {
          const part = await api.getPartById(parseInt(partIdParam, 10));
          if (!part || !part.isActive) {
            showToast('The requested part is no longer available.', 'error');
            navigate('/shop');
            return;
          }
          if (part.stockQuantity <= 0) {
            showToast('This item is currently out of stock.', 'error');
            navigate('/shop');
            return;
          }
          const actualQty = Math.min(quantityParam, part.stockQuantity);
          setCheckoutItems([{
            id: part.id,
            name: part.name,
            price: part.price,
            imageUrl: part.imageUrl,
            categoryName: part.categoryName,
            stockQuantity: part.stockQuantity,
            quantity: actualQty
          }]);
        } catch (err) {
          console.error('Failed to load direct buy part:', err);
          showToast('Failed to load component details.', 'error');
          navigate('/shop');
        } finally {
          setPageLoading(false);
        }
      } else {
        // Cart checkout
        if (cart.length === 0) {
          showToast('Your cart is empty. Browse parts to place an order.', 'warning');
          navigate('/shop');
          return;
        }
        setCheckoutItems(cart);
        setPageLoading(false);
      }
    };

    initCheckout();
  }, [partIdParam, quantityParam, isAuthenticated, cart]);

  // Compute values dynamically (especially if direct purchase)
  const subtotal = partIdParam 
    ? checkoutItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    : cartSubtotal;

  const discount = partIdParam
    ? (subtotal > loyaltyThreshold ? (subtotal * loyaltyRate) : 0)
    : discountApplied;

  const total = subtotal - discount;

  const handleSubmitOrder = async (e) => {
    e.preventDefault();

    if (!shippingAddress.trim()) {
      showToast('Please enter a valid shipping address.', 'error');
      return;
    }

    try {
      setSubmitLoading(true);
      const payload = {
        shippingAddress: shippingAddress.trim(),
        notes: notes.trim() + (paymentMethod === 'Online' ? ` | Paid online via eSewa` : ''),
        paymentMethod: paymentMethod === 'Online' ? 'Paid' : 'Credit',
        items: checkoutItems.map(item => ({
          partId: item.id,
          quantity: item.quantity
        }))
      };

      const result = await api.createStorefrontOrder(payload);
      
      setSuccessOrder({
        orderNumber: result.orderNumber || result.OrderNumber,
        originalAmount: subtotal,
        discountAmount: discount,
        total: total,
        address: shippingAddress.trim(),
        paymentMethod: paymentMethod === 'Online' ? 'eSewa (Paid)' : 'COD / Credit'
      });

      // Clear cart only if it was a cart checkout
      if (!partIdParam) {
        clearCart();
      }

      showToast('Order placed successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to submit checkout order.', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!successOrder) return;

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;

      // Header Banner
      doc.setFillColor(33, 37, 41); // Slate Dark Theme
      doc.rect(0, 0, pageWidth, 40, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text("6IX7EVEN AUTO PARTS", 14, 18);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text("SALES TRANSACTION RECEIPT / INVOICE", 14, 30);

      // Metadata right-aligned
      const customerName = api.getUser()?.fullName || 'Valued Customer';
      doc.setFontSize(9);
      doc.text(`ORDER NO: ${successOrder.orderNumber}`, pageWidth - 90, 16);
      doc.text(`CUSTOMER: ${customerName.toUpperCase()}`, pageWidth - 90, 23);
      doc.text(`DATE: ${new Date().toLocaleDateString()}`, pageWidth - 90, 30);

      doc.setTextColor(33, 37, 41);

      // 1. Transaction Details
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text("1. Order Summary & Delivery", 14, 52);

      const summaryRows = [
        ["Shipping Address", successOrder.address],
        ["Payment Mode", successOrder.paymentMethod],
        ["Fulfillment Status", "Pending Processing"]
      ];

      autoTable(doc, {
        startY: 56,
        head: [["Order Parameter", "Value details"]],
        body: summaryRows,
        theme: 'grid',
        headStyles: { fillColor: [46, 160, 67], textColor: [255, 255, 255] },
        columnStyles: {
          0: { fontStyle: 'bold', width: 60 },
          1: { halign: 'left' }
        }
      });

      let lastY = doc.lastAutoTable.finalY + 12;

      // 2. Purchased Items Breakdown
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text("2. Purchased Components Breakdown", 14, lastY);

      const itemHeaders = [["Item #", "Component Description", "Unit Price", "Qty", "Subtotal"]];
      const itemBody = checkoutItems.map((item, idx) => [
        `#${idx + 1}`,
        item.name,
        `Rs. ${item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        item.quantity.toString(),
        `Rs. ${(item.price * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
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
        ["Gross Subtotal:", `Rs. ${successOrder.originalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
        ["Loyalty Discount:", `-Rs. ${successOrder.discountAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`],
        ["Total Amount Settled:", `Rs. ${successOrder.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`]
      ];

      autoTable(doc, {
        startY: lastY,
        body: totalRows,
        theme: 'plain',
        columnStyles: {
          0: { fontStyle: 'bold', halign: 'right', width: pageWidth - 70 },
          1: { fontStyle: 'bold', halign: 'right' }
        }
      });

      // Signature line
      lastY = doc.lastAutoTable.finalY + 25;
      doc.setDrawColor(200, 200, 200);
      doc.line(14, lastY, 74, lastY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text("Warehouse Dispatch Signature", 14, lastY + 4);

      doc.save(`Invoice_${successOrder.orderNumber}.pdf`);
    } catch (err) {
      console.error("Failed to generate receipt PDF:", err);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 2
    }).format(amount).replace('NPR', 'Rs.');
  };

  if (pageLoading) {
    return (
      <div className="checkout-loading-screen">
        <div className="spinner"></div>
        <p>Preparing secure checkout session...</p>
      </div>
    );
  }

  if (successOrder) {
    return (
      <div className="container checkout-success-page">
        <div className="success-card">
          <div className="success-ring">
            <svg viewBox="0 0 52 52">
              <circle className="success-ring-circle" cx="26" cy="26" r="25" fill="none"/>
              <path className="success-ring-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
          </div>
          <h1>Order Placed Successfully!</h1>
          <p className="subtitle">Thank you for shopping with 6ix7even Auto Parts. Your order has been registered and is being processed in our warehouse.</p>
          
          <div className="receipt-details">
            <div className="receipt-heading">Receipt Summary</div>
            <div className="receipt-row">
              <span>Order Number:</span>
              <strong className="order-number">{successOrder.orderNumber}</strong>
            </div>
            <div className="receipt-row">
              <span>Payment Mode:</span>
              <span>{successOrder.paymentMethod}</span>
            </div>
            <div className="receipt-row">
              <span>Delivery Address:</span>
              <span className="address-val">{successOrder.address}</span>
            </div>
            <div className="receipt-row">
              <span>Subtotal:</span>
              <span>{formatCurrency(successOrder.originalAmount)}</span>
            </div>
            {successOrder.discountAmount > 0 && (
              <div className="receipt-row discount">
                <span>Loyalty Discount:</span>
                <span>-{formatCurrency(successOrder.discountAmount)}</span>
              </div>
            )}
            <div className="receipt-divider"></div>
            <div className="receipt-row total">
              <span>Amount Paid:</span>
              <strong>{formatCurrency(successOrder.total)}</strong>
            </div>
          </div>

          <div className="success-actions" style={{ flexDirection: 'column', gap: '12px' }}>
            <button className="btn-primary" onClick={handleDownloadPDF} style={{ width: '100%', background: '#2ea043', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <polyline points="9 15 12 18 15 15"/>
              </svg>
              Download Invoice PDF
            </button>
            <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
              <button className="btn-secondary" onClick={() => navigate('/customer/orders')} style={{ flex: 1 }}>
                View My Orders
              </button>
              <button className="btn-secondary" onClick={() => navigate('/')} style={{ flex: 1 }}>
                Return to Homepage
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container checkout-page-layout">
      <div className="checkout-main-content">
        <h1 className="checkout-title">Secure Checkout</h1>
        <p className="checkout-subtitle">Please fill in your delivery details and choose your preferred payment method below.</p>
        
        <form onSubmit={handleSubmitOrder}>
          {/* Shipping Form */}
          <div className="checkout-section-card">
            <h3 className="section-title-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              Shipping Address
            </h3>
            
            <div className="form-group">
              <label htmlFor="address">Delivery Address *</label>
              <textarea 
                id="address" 
                rows="3" 
                placeholder="Enter your street address, building, city, and nearest landmark..."
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="notes">Order Notes / Delivery Instructions (Optional)</label>
              <textarea 
                id="notes" 
                rows="2" 
                placeholder="E.g., call upon arrival, leave at reception, preferred time slot..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="checkout-section-card">
            <h3 className="section-title-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
              Select Payment Method
            </h3>

            <div className="payment-options-grid">
              <div 
                className={`payment-option-card ${paymentMethod === 'Online' ? 'active-green' : ''}`}
                onClick={() => setPaymentMethod('Online')}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <div className="option-radio">
                    <div className="radio-circle"></div>
                  </div>
                  <div className="option-content">
                    <span className="option-title">Pay now via eSewa</span>
                    <span className="option-desc">Pay instantly using your eSewa wallet.</span>
                  </div>
                </div>
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/f/ff/Esewa_logo.webp" 
                  alt="eSewa" 
                  style={{ height: '22px', objectFit: 'contain', display: 'block' }}
                  onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=eSewa&background=60bb46&color=fff' }}
                />
              </div>

              <div 
                className={`payment-option-card ${paymentMethod === 'COD' ? 'active-blue' : ''}`}
                onClick={() => setPaymentMethod('COD')}
              >
                <div className="option-radio">
                  <div className="radio-circle"></div>
                </div>
                <div className="option-content">
                  <span className="option-title">COD/Credit</span>
                  <span className="option-desc">Pay with cash when the package is delivered to your doorstep or settle via credit.</span>
                </div>
              </div>
            </div>

          </div>

          <button 
            type="submit" 
            className={`btn-checkout-submit ${paymentMethod === 'Online' ? 'esewa-btn' : ''}`}
            disabled={submitLoading}
          >
            {submitLoading ? 'Finalizing Order...' : (paymentMethod === 'Online' ? `Confirm & Pay via eSewa ${formatCurrency(total)}` : `Confirm Order via COD / Credit`)}
          </button>
        </form>
      </div>

      {/* Sidebar Order Summary */}
      <div className="checkout-sidebar-summary">
        <div className="summary-card">
          <h3>Order Summary</h3>
          <div className="items-list-container">
            {checkoutItems.map((item) => (
              <div key={item.id} className="summary-item-row">
                <div className="item-thumbnail">
                  <img 
                    src={item.imageUrl || `https://ui-avatars.com/api/?name=${item.name}&background=fff&color=e33b3b&size=100`} 
                    alt={item.name}
                    onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${item.name}&background=fff&color=e33b3b&size=100` }}
                  />
                  <span className="item-qty-badge">{item.quantity}</span>
                </div>
                <div className="item-details">
                  <span className="item-name">{item.name}</span>
                  <span className="item-cat">{item.categoryName || 'Auto Component'}</span>
                </div>
                <span className="item-price">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="summary-divider"></div>
          
          <div className="summary-row">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>

          {discount > 0 && (
            <div className="summary-row discount">
              <span>Loyalty Discount</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
          )}

          <div className="summary-row shipping">
            <span>Shipping</span>
            <span className="free-shipping">FREE</span>
          </div>

          <div className="summary-divider"></div>

          <div className="summary-row total">
            <span>Grand Total</span>
            <strong>{formatCurrency(total)}</strong>
          </div>
        </div>

        {/* Loyalty Discount Offer Message */}
        <div className="checkout-promo-banner" style={{ 
          background: subtotal >= loyaltyThreshold ? 'linear-gradient(135deg, rgba(46, 160, 67, 0.15) 0%, rgba(46, 160, 67, 0.05) 100%)' : 'linear-gradient(135deg, rgba(227, 179, 65, 0.1) 0%, rgba(227, 179, 65, 0.02) 100%)', 
          border: subtotal >= loyaltyThreshold ? '1px solid rgba(46, 160, 67, 0.3)' : '1px solid rgba(227, 179, 65, 0.2)', 
          borderRadius: '12px', 
          padding: '16px', 
          marginTop: '16px',
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px' 
        }}>
          <div style={{ 
            background: subtotal >= loyaltyThreshold ? '#2ea043' : '#e3b341', 
            borderRadius: '50%', 
            width: '32px', 
            height: '32px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexShrink: 0 
          }}>
            <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
              <line x1="7" y1="7" x2="7.01" y2="7"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            {subtotal >= loyaltyThreshold ? (
              <>
                <strong style={{ color: '#2ea043', fontSize: '13px', display: 'block', marginBottom: '2px' }}>10% Discount Applied!</strong>
                <span style={{ color: '#aaa', fontSize: '11.5px', lineHeight: '1.4' }}>Order total is over {formatCurrency(loyaltyThreshold)}. You saved {formatCurrency(discount)}!</span>
              </>
            ) : (
              <>
                <strong style={{ color: '#e3b341', fontSize: '13px', display: 'block', marginBottom: '2px' }}>Unlock 10% Discount</strong>
                <span style={{ color: '#aaa', fontSize: '11.5px', lineHeight: '1.4' }}>Spend <strong>{formatCurrency(loyaltyThreshold)}</strong> or more to get <strong>10% off</strong>. Add <strong>{formatCurrency(loyaltyThreshold - subtotal)}</strong> more to your order.</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;
