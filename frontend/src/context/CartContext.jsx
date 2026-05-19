import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    try {
      const stored = localStorage.getItem('storefront_cart');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [loyaltySettings, setLoyaltySettings] = useState({ thresholdAmount: 5000, discountRate: 0.10 });

  useEffect(() => {
    localStorage.setItem('storefront_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    api.getLoyaltySettings()
      .then(settings => {
        if (settings) {
          setLoyaltySettings(settings);
        }
      })
      .catch(err => console.error('Failed to load loyalty settings:', err));
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3500);
  };

  const addToCart = (part, qty = 1) => {
    if (!part || qty <= 0) return;

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === part.id);
      
      if (existingItem) {
        const nextQty = existingItem.quantity + qty;
        if (nextQty > part.stockQuantity) {
          showToast(`Cannot add more. Warehouse stock is capped at ${part.stockQuantity} items.`, 'error');
          return prevCart;
        }
        showToast(`Increased quantity of "${part.name}" in cart.`, 'success');
        return prevCart.map(item => 
          item.id === part.id ? { ...item, quantity: nextQty } : item
        );
      } else {
        if (qty > part.stockQuantity) {
          showToast(`Insufficient stock. Only ${part.stockQuantity} items available.`, 'error');
          return prevCart;
        }
        showToast(`Added "${part.name}" to cart.`, 'success');
        return [...prevCart, {
          id: part.id,
          name: part.name,
          price: part.price,
          imageUrl: part.imageUrl,
          categoryName: part.categoryName,
          stockQuantity: part.stockQuantity,
          quantity: qty
        }];
      }
    });
  };

  const removeFromCart = (partId) => {
    setCart(prevCart => {
      const item = prevCart.find(i => i.id === partId);
      if (item) {
        showToast(`Removed "${item.name}" from cart.`, 'warning');
      }
      return prevCart.filter(item => item.id !== partId);
    });
  };

  const updateQuantity = (partId, qty) => {
    if (qty <= 0) {
      removeFromCart(partId);
      return;
    }

    setCart(prevCart => 
      prevCart.map(item => {
        if (item.id === partId) {
          if (qty > item.stockQuantity) {
            showToast(`Cannot exceed warehouse stock of ${item.stockQuantity} units.`, 'error');
            return item;
          }
          return { ...item, quantity: qty };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const discountApplied = cartSubtotal > loyaltySettings.thresholdAmount ? (cartSubtotal * loyaltySettings.discountRate) : 0;
  const cartTotal = cartSubtotal - discountApplied;

  return (
    <CartContext.Provider value={{
      cart,
      cartCount,
      cartSubtotal,
      discountApplied,
      cartTotal,
      loyaltyThreshold: loyaltySettings.thresholdAmount,
      loyaltyRate: loyaltySettings.discountRate,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      showToast
    }}>
      {children}

      {/* Floating Animated Premium Success/Alert Toast notification banner */}
      {toast.show && (
        <div className={`storefront-toast-alert ${toast.type}`}>
          <div className="toast-content-wrapper">
            <span className="toast-icon">
              {toast.type === 'success' && '✓'}
              {toast.type === 'error' && '✕'}
              {toast.type === 'warning' && '⚠'}
            </span>
            <p className="toast-msg">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Inline styles so we do not pollute or require extra files */}
      <style>{`
        .storefront-toast-alert {
          position: fixed;
          top: 30px;
          right: 30px;
          z-index: 99999;
          padding: 16px 24px;
          border-radius: 12px;
          color: #fff;
          font-family: inherit;
          font-size: 14px;
          font-weight: 600;
          box-shadow: 0 12px 40px rgba(0,0,0,0.4);
          animation: slideInDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          border: 1px solid rgba(255, 255, 255, 0.08);
          max-width: 380px;
        }
        .storefront-toast-alert.success {
          background: linear-gradient(135deg, #131b15 0%, #0c100d 100%);
          border-left: 4px solid #2ea043;
          color: #3fb950;
        }
        .storefront-toast-alert.error {
          background: linear-gradient(135deg, #221415 0%, #150d0e 100%);
          border-left: 4px solid #f85149;
          color: #ff7b72;
        }
        .storefront-toast-alert.warning {
          background: linear-gradient(135deg, #221a10 0%, #15100a 100%);
          border-left: 4px solid #d29922;
          color: #d29922;
        }
        .toast-content-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .toast-icon {
          font-size: 16px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.03);
          flex-shrink: 0;
        }
        .toast-msg {
          margin: 0;
          line-height: 1.4;
        }
        @keyframes slideInDown {
          from { transform: translateY(-30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used inside a CartProvider');
  }
  return context;
};
