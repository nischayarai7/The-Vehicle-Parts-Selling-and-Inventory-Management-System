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
        // If it goes anywhere other than landing home page, login, register, about, contact, or verify-email
        const path = href.split('?')[0]; // strip query params
        const publicPaths = ['/', '/login', '/register', '/about', '/contact', '/verify-email'];
        if (!publicPaths.includes(path)) {
          shouldBlock = true;
        }
      }
    } else if (button) {
      // Block search buttons, add to carts, and other action buttons unless they are login/register or close buttons
      const isCloseBtn = button.classList.contains('close-modal-btn');
      const isAllowedButton = button.closest('.auth-card') || button.closest('.navbar-auth-buttons') || isCloseBtn;
      if (!isAllowedButton) {
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
                <span className="feature-icon-bullet">🏷️</span>
                <span><strong>20% Member Discount</strong> automatically applied at checkout</span>
              </div>
              <div className="modal-feature-item">
                <span className="feature-icon-bullet">🚗</span>
                <span><strong>Smart Garage Tools</strong> to match exact-fit vehicle parts</span>
              </div>
              <div className="modal-feature-item">
                <span className="feature-icon-bullet">📦</span>
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
