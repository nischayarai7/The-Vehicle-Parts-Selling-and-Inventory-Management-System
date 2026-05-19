import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  
  const { 
    cart, 
    cartCount, 
    cartSubtotal, 
    discountApplied,
    cartTotal,
    loyaltyThreshold,
    loyaltyRate,
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    showToast 
  } = useCart();

  const searchParams = new URLSearchParams(location.search);
  const urlSearchQuery = searchParams.get('search') || '';

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState(urlSearchQuery);
  const [shippingAddress, setShippingAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [successOrder, setSuccessOrder] = useState(null);

  // Keep the top search input synced when URL query changes (e.g. cleared on ShopPage)
  useEffect(() => {
    setSearchKeyword(urlSearchQuery);
  }, [urlSearchQuery]);

  const handleLogout = () => {
    dispatch(logout());
    setIsDrawerOpen(false);
    navigate('/login');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchKeyword.trim())}`);
    } else {
      navigate('/shop');
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast('Please login to finalize your purchase order.', 'error');
      navigate('/login');
      setIsDrawerOpen(false);
      return;
    }

    if (!shippingAddress.trim()) {
      showToast('Please input a valid shipping delivery address.', 'error');
      return;
    }

    try {
      setCheckoutLoading(true);
      const payload = {
        shippingAddress: shippingAddress.trim(),
        notes: notes.trim(),
        items: cart.map(item => ({
          partId: item.id,
          quantity: item.quantity
        }))
      };

      const result = await api.createStorefrontOrder(payload);
      setSuccessOrder({
        orderNumber: result.orderNumber || result.OrderNumber,
        originalAmount: cartSubtotal,
        discountAmount: discountApplied,
        total: cartTotal,
        address: shippingAddress.trim()
      });

      clearCart();
      setShippingAddress('');
      setNotes('');
      setIsDrawerOpen(false);
    } catch (err) {
      showToast(err.message || 'Failed to place storefront order.', 'error');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 2
    }).format(amount).replace('NPR', 'Rs.');
  };

  return (
    <>
      <header className="navbar">
        <div className="container navbar-container">
          {/* Logo */}
          <div className="navbar-logo">
            <Link to="/">
              <h2>6IX7EVEN.</h2>
            </Link>
          </div>

          {/* Search Bar */}
          <form className="navbar-search" onSubmit={handleSearchSubmit}>
            <input 
              type="text" 
              placeholder="Search for parts, brands, component names..." 
              value={searchKeyword}
              onChange={(e) => {
                const val = e.target.value;
                setSearchKeyword(val);
                
                const newParams = new URLSearchParams(location.search);
                if (val.trim()) {
                  newParams.set('search', val);
                } else {
                  newParams.delete('search');
                }
                
                if (location.pathname !== '/shop') {
                  navigate(`/shop?${newParams.toString()}`);
                } else {
                  navigate(`/shop?${newParams.toString()}`, { replace: true });
                }
              }}
            />
            <button type="submit" className="search-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
              </svg>
            </button>
          </form>

          {/* Icons & Account */}
          <div className="navbar-actions">
            {isAuthenticated ? (
              <div className="user-menu dropdown-container">
                <div className="nav-profile dropdown-trigger">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar" className="nav-avatar" />
                  ) : (
                    <div className="nav-avatar-placeholder">
                      {user?.fullName?.charAt(0) || 'U'}
                    </div>
                  )}
                  <span>{user?.fullName?.split(' ')[0] || 'User'}</span>
                </div>
                <div className="dropdown-menu">
                  {user?.role === 'Admin' && (
                    <Link to="/admin" className="dropdown-item">Admin Dashboard</Link>
                  )}
                  {(user?.role === 'Staff' || user?.role === 'Admin') && (
                    <Link to="/staff" className="dropdown-item">Staff Dashboard</Link>
                  )}
                  {user?.role === 'Customer' && (
                    <Link to="/customer/dashboard" className="dropdown-item">My Dashboard</Link>
                  )}
                  <Link to="/settings" className="dropdown-item">Profile Settings</Link>
                  <div className="dropdown-divider"></div>
                  <button onClick={handleLogout} className="dropdown-item">Logout</button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="login-link">Login / Register</Link>
            )}
            
            <div className="cart-icon" onClick={() => setIsDrawerOpen(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5zM3.102 4l1.313 7h8.17l1.313-7H3.102zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
              </svg>
              {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
            </div>
          </div>
        </div>
        
        {/* Bottom Navigation Row */}
        <div className="navbar-bottom">
          <div className="container nav-links-container">
            <button className="browse-categories-btn" onClick={() => navigate('/categories')}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/>
              </svg>
              Browse Categories
            </button>
            <ul className="nav-links">
              <li><NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>Home</NavLink></li>
              <li><NavLink to="/shop" className={({ isActive }) => (isActive ? 'active' : '')}>Shop</NavLink></li>
              <li><NavLink to="/categories" className={({ isActive }) => (isActive ? 'active' : '')}>Categories</NavLink></li>
              <li><NavLink to="/about" className={({ isActive }) => (isActive ? 'active' : '')}>About Us</NavLink></li>
              <li><NavLink to="/contact" className={({ isActive }) => (isActive ? 'active' : '')}>Contact</NavLink></li>
            </ul>
          </div>
        </div>
      </header>

      {/* Slide-out Shopping Cart Drawer Panel */}
      {isDrawerOpen && (
        <div className="cart-drawer-backdrop" onClick={() => setIsDrawerOpen(false)}>
          <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3>Shopping Cart ({cartCount})</h3>
              <button className="close-drawer-btn" onClick={() => setIsDrawerOpen(false)}>✕</button>
            </div>

            <div className="drawer-body">
              {cart.length === 0 ? (
                <div className="empty-cart-state">
                  <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" viewBox="0 0 16 16" style={{ opacity: 0.3, marginBottom: '16px' }}>
                    <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5zM3.102 4l1.313 7h8.17l1.313-7H3.102zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                  </svg>
                  <p>Your shopping cart is currently empty.</p>
                  <button className="btn-primary" onClick={() => { setIsDrawerOpen(false); navigate('/shop'); }}>Browse Store</button>
                </div>
              ) : (
                <div className="drawer-items-list">
                  {cart.map(item => (
                    <div key={item.id} className="drawer-line-item">
                      <img 
                        src={item.imageUrl || `https://ui-avatars.com/api/?name=${item.name}&background=fff&color=e33b3b&size=100`} 
                        alt={item.name} 
                        className="line-item-img"
                        onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${item.name}&background=fff&color=e33b3b&size=100` }}
                      />
                      <div className="line-item-details">
                        <h4>{item.name}</h4>
                        <p className="line-item-cat">{item.categoryName || 'Auto Component'}</p>
                        <div className="line-item-pricing">
                          <span className="unit-price">{formatCurrency(item.price)}</span>
                          <div className="quantity-controller">
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                            <span>{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                          </div>
                        </div>
                      </div>
                      <button className="remove-item-btn" onClick={() => removeFromCart(item.id)}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="drawer-footer">
                <div className="subtotal-row" style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span style={{ fontSize: '14px', opacity: 0.8, color: 'rgba(255,255,255,0.7)' }}>Cart Subtotal:</span>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: '#fff' }}>{formatCurrency(cartSubtotal)}</span>
                  </div>
                  {discountApplied > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', color: '#3fb950' }}>
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>Loyalty Discount ({Math.round(loyaltyRate * 100)}%):</span>
                      <span style={{ fontSize: '14px', fontWeight: '600' }}>-{formatCurrency(discountApplied)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: '4px' }}>
                    <span style={{ fontSize: '16px', fontWeight: '600', color: '#fff' }}>Total Amount:</span>
                    <strong style={{ fontSize: '18px', color: '#ff3e3e', fontWeight: '700' }}>{formatCurrency(cartTotal)}</strong>
                  </div>
                </div>

                <form className="drawer-checkout-form" onSubmit={handleCheckout}>
                  <div className="checkout-field">
                    <label>Shipping Address *</label>
                    <textarea 
                      placeholder="Input complete delivery and street address..." 
                      value={shippingAddress} 
                      onChange={(e) => setShippingAddress(e.target.value)}
                      required
                    />
                  </div>

                  <div className="checkout-field">
                    <label>Delivery Instructions / Notes</label>
                    <textarea 
                      placeholder="Special instructions for courier..." 
                      value={notes} 
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  {!isAuthenticated ? (
                    <div className="drawer-login-prompt">
                      <p>You must be authenticated to check out.</p>
                      <button type="button" className="btn-primary" onClick={() => { setIsDrawerOpen(false); navigate('/login'); }} style={{ width: '100%' }}>Login / Register</button>
                    </div>
                  ) : (
                    <button 
                      type="submit" 
                      className="btn-primary checkout-submit-btn" 
                      disabled={checkoutLoading}
                    >
                      {checkoutLoading ? 'Processing Checkout...' : 'Confirm & Place Order'}
                    </button>
                  )}
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Order Finalized Overlay Success Modal */}
      {successOrder && (
        <div className="checkout-success-backdrop" onClick={() => setSuccessOrder(null)}>
          <div className="checkout-success-modal" onClick={(e) => e.stopPropagation()}>
            <div className="success-icon-badge">✓</div>
            <h3>Purchase Finalized Successfully!</h3>
            <p className="success-subtitle">Thank you for choosing 6ix7even Auto Parts. Your order is registered in our warehouse catalog.</p>
            
            <div className="success-invoice-receipt">
              <div className="receipt-line">
                <span>Order Reference:</span>
                <strong>{successOrder.orderNumber}</strong>
              </div>
              <div className="receipt-line">
                <span>Payment Method:</span>
                <strong>Cash on Delivery (COD)</strong>
              </div>
              <div className="receipt-line">
                <span>Shipping Address:</span>
                <span className="address-preview">{successOrder.address}</span>
              </div>
              <div className="receipt-line">
                <span>Item Subtotal:</span>
                <strong>{formatCurrency(successOrder.originalAmount)}</strong>
              </div>
              {successOrder.discountAmount > 0 && (
                <div className="receipt-line" style={{ color: '#2ea043' }}>
                  <span>Loyalty Discount Applied:</span>
                  <strong>-{formatCurrency(successOrder.discountAmount)}</strong>
                </div>
              )}
              <hr />
              <div className="receipt-line total">
                <span>Grand Total:</span>
                <strong>{formatCurrency(successOrder.total)}</strong>
              </div>
            </div>

            <button className="btn-primary" onClick={() => setSuccessOrder(null)} style={{ width: '100%', marginTop: '20px' }}>
              Continue Shopping ➔
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
