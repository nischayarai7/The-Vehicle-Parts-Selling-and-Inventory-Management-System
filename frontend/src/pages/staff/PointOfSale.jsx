import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

const PointOfSale = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [parts, setParts] = useState([]);
  
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [cart, setCart] = useState([]);
  const [notes, setNotes] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let timer;
    if (message) {
      timer = setTimeout(() => {
        setMessage('');
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    fetchCustomers();
    fetchParts();
  }, []);

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
      setError('Please select a customer.');
      return;
    }
    if (cart.length === 0) {
      setError('Cart is empty.');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const payload = {
        customerId: parseInt(selectedCustomerId),
        notes,
        items: cart.map(i => ({ partId: i.partId, quantity: i.quantity }))
      };
      
      // Send the order to the backend
      const res = await api.createStaffOrder(payload);
      
      // Get the correct ID property (ASP.NET Core typically camelCases it to 'orderId')
      const orderId = res.orderId || res.OrderId;
      
      // Generate and display the invoice right after order confirmation
      navigate(`/staff/invoice/${orderId}`);
      
    } catch (err) {
      setError(err.response?.data || 'Failed to complete sale');
    } finally {
      setLoading(false);
    }
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>Point of Sale</h2>
      
      {message && (
        <div style={{ 
          background: 'rgba(46, 204, 113, 0.1)', 
          color: '#2ecc71', 
          padding: '10px 15px', 
          borderRadius: '4px', 
          marginBottom: '15px',
          border: '1px solid rgba(46, 204, 113, 0.3)'
        }}>
          {message}
        </div>
      )}
      {error && <div style={{ color: 'var(--danger)', marginBottom: '15px' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Left Side: Product Selection */}
        <div className="large-card">
          <h3 style={{ marginBottom: '20px' }}>Available Parts</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            {parts.map(p => (
              <div key={p.id} style={{ border: '1px solid var(--admin-border)', padding: '15px', borderRadius: '8px', background: 'var(--admin-bg)' }}>
                <strong>{p.name}</strong><br/>
                <span style={{ color: 'var(--success)' }}>${p.price.toFixed(2)}</span> | Stock: {p.stockQuantity}<br/>
                <button onClick={() => addToCart(p)} className="dashboard-btn" style={{ marginTop: '10px', marginLeft: 0 }}>Add to Cart</button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Cart and Checkout */}
        <div className="large-card" style={{ height: 'fit-content' }}>
          <h3 style={{ marginBottom: '20px' }}>Current Sale</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: 'var(--admin-text-muted)' }}>Select Customer</label>
            <select 
              value={selectedCustomerId} 
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              style={{ width: '100%', padding: '10px', background: '#1c2128', border: '1px solid var(--admin-border)', color: 'white', borderRadius: '4px' }}
            >
              <option value="">-- Choose Customer --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.fullName} ({c.email})</option>
              ))}
            </select>
          </div>

          <hr style={{ borderColor: 'var(--admin-border)', margin: '20px 0' }}/>
          <h4 style={{ marginBottom: '10px' }}>Cart Items</h4>
          {cart.length === 0 ? <p style={{ color: 'var(--admin-text-muted)' }}>Cart is empty</p> : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {cart.map(item => (
                <li key={item.partId} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--admin-border)' }}>
                  <div>
                    <strong>{item.name}</strong><br/>
                    ${item.price.toFixed(2)} x 
                    <input 
                      type="number" 
                      value={item.quantity} 
                      onChange={(e) => updateQuantity(item.partId, parseInt(e.target.value))}
                      style={{ width: '50px', marginLeft: '5px', background: '#1c2128', color: 'white', border: '1px solid var(--admin-border)', padding: '2px 5px', borderRadius: '4px' }}
                      min="1"
                      max={item.max}
                    />
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    ${(item.price * item.quantity).toFixed(2)}<br/>
                    <button onClick={() => removeFromCart(item.partId)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', marginTop: '5px', fontSize: '12px' }}>Remove</button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <hr style={{ borderColor: 'var(--admin-border)', margin: '20px 0' }}/>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: 'var(--admin-text-muted)' }}>Sale Notes</label>
            <textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              style={{ width: '100%', padding: '10px', background: '#1c2128', border: '1px solid var(--admin-border)', color: 'white', borderRadius: '4px', resize: 'vertical' }}
            ></textarea>
          </div>

          <h3 style={{ textAlign: 'right', marginBottom: '20px' }}>Total: ${total.toFixed(2)}</h3>
          <button 
            className="btn-primary" 
            style={{ width: '100%', background: 'var(--success)' }}
            onClick={handleCheckout}
            disabled={loading || cart.length === 0 || !selectedCustomerId}
          >
            {loading ? 'Processing...' : 'Complete Sale'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PointOfSale;
