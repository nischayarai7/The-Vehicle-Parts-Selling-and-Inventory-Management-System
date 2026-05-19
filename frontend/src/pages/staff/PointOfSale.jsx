import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import './PointOfSale.css';

const PointOfSale = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [parts, setParts] = useState([]);
  
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [cart, setCart] = useState([]);
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Paid');
  const [searchTerm, setSearchTerm] = useState('');
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [loyaltySettings, setLoyaltySettings] = useState({ thresholdAmount: 5000, discountRate: 0.10 });
  
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchCustomers();
    fetchParts();
    fetchLoyaltySettings();
  }, []);

  const fetchLoyaltySettings = async () => {
    try {
      const res = await api.getLoyaltySettings();
      if (res) {
        setLoyaltySettings(res);
      }
    } catch (err) {
      console.error('Failed to fetch loyalty settings:', err);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await api.getStaffCustomers();
      setCustomers(res);
    } catch (err) {
      console.error('Failed to fetch customers', err);
    }
  };

  const fetchParts = async () => {
    try {
      const res = await api.getAllParts();
      setParts(res.filter(p => p.isActive && p.stockQuantity > 0));
    } catch (err) {
      console.error('Failed to fetch parts', err);
    }
  };

  const addToCart = (part) => {
    const existing = cart.find(i => i.partId === part.id);
    if (existing) {
      if (existing.quantity >= part.stockQuantity) return;
      setCart(cart.map(i => i.partId === part.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { partId: part.id, name: part.name, price: part.price, max: part.stockQuantity, quantity: 1 }]);
    }
  };

  const removeFromCart = (partId) => {
    setCart(cart.filter(i => i.partId !== partId));
  };

  const updateQuantity = (partId, qty) => {
    if (qty < 1) return;
    setCart(cart.map(i => {
      if (i.partId === partId) {
        return { ...i, quantity: Math.min(qty, i.max) };
      }
      return i;
    }));
  };

  const handleCheckout = async () => {
    if (!selectedCustomerId) {
      showToast('Please select a customer before checkout.', 'error');
      return;
    }
    if (cart.length === 0) {
      showToast('Cart is empty. Add items to proceed.', 'error');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        customerId: parseInt(selectedCustomerId),
        notes,
        paymentMethod,
        items: cart.map(i => ({ partId: i.partId, quantity: i.quantity }))
      };
      
      const res = await api.createStaffOrder(payload);
      const orderId = res.orderId || res.OrderId;
      navigate(`/staff/invoice/${orderId}`);
      
    } catch (err) {
      showToast(err.response?.data || 'Failed to complete sale', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 2
    }).format(amount).replace('NPR', 'Rs.');
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discount = subtotal > loyaltySettings.thresholdAmount ? (subtotal * loyaltySettings.discountRate) : 0;
  const total = subtotal - discount;

  // Filter parts by search
  const filteredParts = parts.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.partNumber && p.partNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredCustomers = customers.filter(c => 
    c.fullName.toLowerCase().includes(customerSearchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(customerSearchTerm.toLowerCase())
  );

  const selectedCustomer = customers.find(c => c.id.toString() === selectedCustomerId.toString());

  return (
    <div className="pos-container">
      {/* Toast */}
      {toast && (
        <div className={`pos-toast ${toast.type}`}>
          <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            {toast.type === 'success' ? (
              <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>
            ) : (
              <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>
            )}
          </svg>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="pos-page-header">
        <div>
          <h2>Point of Sale</h2>
          <p>Browse available inventory, build a cart, and finalize customer checkout.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--admin-text-muted)', fontSize: '13px' }}>
          <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          <span>{cart.length} item{cart.length !== 1 ? 's' : ''} in cart</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="pos-grid">
        {/* Left: Product Catalog */}
        <div className="pos-catalog-panel">
          <div className="catalog-toolbar">
            <h3>Inventory Catalog ({filteredParts.length})</h3>
            <div className="catalog-search-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input 
                type="text" 
                placeholder="Search parts, brand, SKU..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="catalog-items-grid">
            {filteredParts.length === 0 ? (
              <div className="catalog-empty">No parts match your search criteria.</div>
            ) : (
              filteredParts.map(p => (
                <div key={p.id} className="product-item-card">
                  {/* Product Image */}
                  <div className="product-img-box">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} />
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 8l-9-4-9 4v8l9 4 9-4V8zM12 4v16m-9-12l9 4 9-4"/></svg>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="product-info-block">
                    <div className="product-name-row">
                      <strong>{p.name}</strong>
                      {p.partNumber && <span className="product-part-number">{p.partNumber}</span>}
                    </div>
                    <div className="product-meta-row">
                      {p.brand && <span>{p.brand}</span>}
                      {p.brand && p.condition && <span className="product-meta-divider"></span>}
                      {p.condition && <span>{p.condition}</span>}
                      {(p.brand || p.condition) && p.categoryName && <span className="product-meta-divider"></span>}
                      {p.categoryName && <span>{p.categoryName}</span>}
                    </div>
                  </div>

                  {/* Price & Stock */}
                  <div className="product-price-col">
                    <div className="product-price-val">{formatCurrency(p.price)}</div>
                    <div className={`product-stock-tag ${p.stockQuantity <= (p.reorderLevel || 5) ? 'low' : ''}`}>
                      {p.stockQuantity} in stock
                    </div>
                  </div>

                  {/* Add Button */}
                  <button className="btn-add-cart" onClick={() => addToCart(p)}>
                    <svg style={{ width: '12px', height: '12px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Add
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Cart Panel */}
        <div className="pos-cart-panel">
          <div className="cart-header">
            <h3>Current Sale</h3>
          </div>

          <div className="cart-body">
            {/* Customer Select */}
            <div className="cart-field-group" style={{ position: 'relative' }}>
              <label>Customer Account</label>
              
              <div 
                className={`custom-select-trigger ${customerDropdownOpen ? 'open' : ''}`}
                onClick={() => {
                  setCustomerDropdownOpen(!customerDropdownOpen);
                  setCustomerSearchTerm(''); // reset search when opening
                }}
              >
                <div className="custom-select-value">
                  {selectedCustomer ? (
                    <div className="selected-customer-display">
                      <div className="sc-avatar">{selectedCustomer.fullName.charAt(0)}</div>
                      <div className="sc-info">
                        <span className="sc-name">{selectedCustomer.fullName}</span>
                        <span className="sc-email">{selectedCustomer.email}</span>
                      </div>
                    </div>
                  ) : (
                    <span className="sc-placeholder">-- Select Customer --</span>
                  )}
                </div>
                <svg className="custom-select-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
              </div>

              {customerDropdownOpen && (
                <>
                  <div className="custom-select-overlay" onClick={() => setCustomerDropdownOpen(false)}></div>
                  <div className="custom-select-dropdown">
                    <div className="custom-select-search">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                      <input 
                        type="text" 
                        placeholder="Search by name or email..." 
                        autoFocus
                        value={customerSearchTerm}
                        onChange={(e) => setCustomerSearchTerm(e.target.value)}
                      />
                    </div>
                    <ul className="custom-select-options">
                      <li 
                        className={`custom-select-option ${!selectedCustomerId ? 'selected' : ''}`}
                        onClick={() => { setSelectedCustomerId(''); setCustomerDropdownOpen(false); }}
                        style={{ justifyContent: 'center', color: 'var(--admin-text-muted)' }}
                      >
                        -- Clear Selection --
                      </li>
                      {filteredCustomers.length === 0 ? (
                        <li className="custom-select-empty">No customers found.</li>
                      ) : (
                        filteredCustomers.map(c => (
                          <li 
                            key={c.id}
                            className={`custom-select-option ${selectedCustomerId.toString() === c.id.toString() ? 'selected' : ''}`}
                            onClick={() => { setSelectedCustomerId(c.id); setCustomerDropdownOpen(false); }}
                          >
                            <div className="sc-avatar small">{c.fullName.charAt(0)}</div>
                            <div className="sc-info">
                              <span className="sc-name">{c.fullName}</span>
                              <span className="sc-email">{c.email}</span>
                            </div>
                            {selectedCustomerId.toString() === c.id.toString() && (
                              <svg className="sc-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                            )}
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                </>
              )}
            </div>

            <hr className="cart-divider" />

            {/* Cart Items */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--admin-text-muted)' }}>
                Cart Items ({cart.length})
              </label>
              {cart.length === 0 ? (
                <p className="cart-empty-text">No items added yet.</p>
              ) : (
                <ul className="cart-items-list">
                  {cart.map(item => (
                    <li key={item.partId} className="cart-line-item">
                      <div className="cart-item-info">
                        <strong>{item.name}</strong>
                        <div className="cart-item-price-row">
                          <span>{formatCurrency(item.price)}</span>
                          <span>×</span>
                          <div className="cart-qty-selector">
                            <button 
                              type="button"
                              onClick={() => updateQuantity(item.partId, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className="qty-change-btn minus"
                              title="Decrease Quantity"
                            >
                              -
                            </button>
                            <input 
                              type="number" 
                              value={item.quantity} 
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                updateQuantity(item.partId, isNaN(val) ? 1 : val);
                              }}
                              className="cart-qty-input"
                              min="1"
                              max={item.max}
                            />
                            <button 
                              type="button"
                              onClick={() => updateQuantity(item.partId, item.quantity + 1)}
                              disabled={item.quantity >= item.max}
                              className="qty-change-btn plus"
                              title="Increase Quantity"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="cart-item-right">
                        <span className="cart-item-subtotal">{formatCurrency(item.price * item.quantity)}</span>
                        <button onClick={() => removeFromCart(item.partId)} className="btn-remove-item">
                          <svg style={{ width: '10px', height: '10px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <hr className="cart-divider" />

            {/* Payment Selection */}
            <div className="cart-field-group">
              <label>Checkout Settlement Option</label>
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Paid')}
                  className={`payment-btn paid ${paymentMethod === 'Paid' ? 'active' : ''}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" ry="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                  Paid Settlement
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Credit')}
                  className={`payment-btn credit ${paymentMethod === 'Credit' ? 'active' : ''}`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Credit Deferred
                </button>
              </div>
            </div>

            {/* Notes */}
            <div className="cart-field-group">
              <label>Sale Notes</label>
              <textarea 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional transaction notes..."
                className="cart-textarea"
              ></textarea>
            </div>
          </div>

          {/* Footer */}
          <div className="cart-footer" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--admin-text-muted)', opacity: 0.8 }}>
              <span>Subtotal Amount:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#2ea043', fontWeight: '500' }}>
                <span>Loyalty Discount ({Math.round(loyaltySettings.discountRate * 100)}%):</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="cart-total-row" style={{ marginTop: '4px', paddingTop: '8px', borderTop: '1px solid var(--admin-border)' }}>
              <span className="cart-total-label">Total Amount</span>
              <span className="cart-total-value">{formatCurrency(total)}</span>
            </div>
            <button 
              className="btn-checkout"
              onClick={handleCheckout}
              disabled={loading || cart.length === 0 || !selectedCustomerId}
            >
              {loading ? (
                <>
                  <svg className="refresh-icon-svg spinning" style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                  Processing Sale...
                </>
              ) : (
                <>
                  <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                  Complete Checkout
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PointOfSale;
