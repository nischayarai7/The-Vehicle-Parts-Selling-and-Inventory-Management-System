import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const StoreLayout = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [showLockModal, setShowLockModal] = useState(false);

  const handleGlobalClick = (e) => {
    if (isAuthenticated) return;

    // Find closest interactive element
    const link = e.target.closest('a');
    const button = e.target.closest('button');
    const promoCard = e.target.closest('[data-promo-click="true"]');

    let shouldBlock = false;

    if (link) {
      const href = link.getAttribute('href');
      if (href) {
        const path = href.split('?')[0]; // strip query params
        // Allow public pages: home, auth, about, contact, verify-email, shop, product details, categories
        const publicPaths = ['/', '/login', '/register', '/about', '/contact', '/verify-email', '/shop', '/categories'];
        const isPublicPath = publicPaths.includes(path) || path.startsWith('/shop/');
        if (!isPublicPath) {
          shouldBlock = true;
        }
      }
    } else if (button) {
      // Only block purchase / add-to-cart action buttons for non-logged-in users
      const isBuyAction = button.classList.contains('add-to-cart-btn') || 
                          button.classList.contains('btn-add-to-cart-icon-small') || 
                          button.classList.contains('btn-buy-now') || 
                          button.classList.contains('btn-add-to-cart-icon');
      if (isBuyAction) {
        shouldBlock = true;
      }
    } else if (promoCard) {
      shouldBlock = true;
    }

    if (shouldBlock) {
      e.preventDefault();
      e.stopPropagation();
      setShowLockModal(true);
    }
  };

  return (
    <div className="store-layout" onClick={handleGlobalClick}>
      <Navbar />
      <main className="store-main">
        <Outlet />
      </main>
      <Footer />

      {/* Unlock Premium Access Modal Overlay */}
      {showLockModal && (
        <div className="auth-lock-overlay" onClick={() => setShowLockModal(false)}>
          <div className="auth-lock-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={() => setShowLockModal(false)}>&times;</button>
            
            <div className="lock-icon-container">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>

            <h2 className="lock-modal-title">Unlock Premium Access</h2>
            <p className="lock-modal-subtitle">
              Sign in or create an account to view product details, customize your garage, and claim limited-time deals!
            </p>

            <div className="modal-features-list">
              <div className="modal-feature-item">
                <span className="feature-icon-bullet">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                </span>
                <span><strong>20% Member Discount</strong> automatically applied at checkout</span>
              </div>
              <div className="modal-feature-item">
                <span className="feature-icon-bullet">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 9.36l-7.19 7.19a2 2 0 0 1-2.83-2.83l7.19-7.19a6 6 0 0 1 9.36-7.94l-3.76 3.76z"></path></svg>
                </span>
                <span><strong>Smart Garage Tools</strong> to match exact-fit vehicle parts</span>
              </div>
              <div className="modal-feature-item">
                <span className="feature-icon-bullet">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                </span>
                <span><strong>Order Tracking</strong> and express delivery support</span>
              </div>
            </div>

            <div className="modal-action-buttons">
              <Link to="/login" className="btn-modal-primary" onClick={() => setShowLockModal(false)}>
                Sign In
              </Link>
              <Link to="/register" className="btn-modal-secondary" onClick={() => setShowLockModal(false)}>
                Create Free Account
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreLayout;
