import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import './ReviewManager.css';

const StarRating = ({ rating, size = 16 }) => {
  return (
    <div style={{ display: 'flex', gap: '3px' }}>
      {[1, 2, 3, 4, 5].map(star => {
        const isFilled = star <= rating;
        return (
          <svg
            key={star}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill={isFilled ? '#e3b341' : 'none'}
            stroke={isFilled ? '#e3b341' : '#4a4a4a'}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              filter: isFilled ? 'drop-shadow(0 0 3px rgba(227, 179, 65, 0.35))' : 'none'
            }}
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        );
      })}
    </div>
  );
};

const ReviewManager = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'approved'
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminServiceReviews();
      setReviews(data || []);
    } catch (err) {
      console.error('Failed to load reviews:', err);
      showToast('Failed to retrieve service feedback list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleToggleApproval = async (id, currentStatus) => {
    try {
      setProcessingId(id);
      const newStatus = !currentStatus;
      const res = await api.updateServiceReviewVisibility(id, newStatus);
      showToast(res?.message || (newStatus ? 'Review approved!' : 'Review hidden!'), 'success');
      
      // Update local state dynamically
      setReviews(prev => prev.map(r => r.id === id ? { ...r, isVisible: newStatus, updatedAt: new Date().toISOString() } : r));
    } catch (err) {
      console.error('Failed to toggle review visibility:', err);
      showToast(err?.message || 'Failed to update review status.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  // Stats Calculations
  const totalCount = reviews.length;
  const approvedCount = reviews.filter(r => r.isVisible).length;
  const pendingCount = reviews.filter(r => !r.isVisible).length;
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  // Filter & Search application
  const filteredReviews = reviews.filter(r => {
    // Status Filter
    if (filter === 'approved' && !r.isVisible) return false;
    if (filter === 'pending' && r.isVisible) return false;

    // Search Term Filter
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      const customerName = (r.customer?.fullName || '').toLowerCase();
      const customerEmail = (r.customer?.email || '').toLowerCase();
      const commentText = (r.comment || '').toLowerCase();
      return customerName.includes(term) || customerEmail.includes(term) || commentText.includes(term);
    }

    return true;
  });

  return (
    <div className="review-manager-container">
      {/* Toast Alert */}
      {toast && (
        <div className={`reports-toast-banner ${toast.type}`}>
          <div className="toast-content-wrapper">
            {toast.type === 'success' ? (
              <svg style={{ width: '16px', height: '16px', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            ) : (
              <svg style={{ width: '16px', height: '16px', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <div className="reports-header-row">
        <div>
          <h2>Service Reviews & Feedbacks</h2>
          <p className="subtitle">Audit, moderate, and approve customer testimonial feeds for the storefront landing page.</p>
        </div>
        <button onClick={loadReviews} className="professional-pdf-btn" disabled={loading} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--admin-border)', color: 'var(--admin-text)' }}>
          <svg className={loading ? "spin-animation" : ""} style={{ width: '15px', height: '15px', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
          </svg>
          <span>{loading ? 'Reloading...' : 'Refresh Records'}</span>
        </button>
      </div>

      {/* KPI Dashboard Stats Cards */}
      <div className="orders-kpi-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-icon-wrapper blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">{totalCount}</div>
            <div className="stat-label">Total Submissions</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">{approvedCount}</div>
            <div className="stat-label">Live on Homepage</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper orange">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">{pendingCount}</div>
            <div className="stat-label">Pending Approval</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper gold">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">{averageRating} ★</div>
            <div className="stat-label">Avg Service Rating</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar Row */}
      <div className="review-filters-bar">
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Submissions
          </button>
          <button 
            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
            style={{ position: 'relative' }}
          >
            Pending Moderation
            {pendingCount > 0 && <span className="pending-badge-count">{pendingCount}</span>}
          </button>
          <button 
            className={`filter-btn ${filter === 'approved' ? 'active' : ''}`}
            onClick={() => setFilter('approved')}
          >
            Approved & Live
          </button>
        </div>

        <div className="search-box-wrapper">
          <svg className="search-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input 
            type="text" 
            placeholder="Search reviews by client or comment text..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Main Reviews Display Section */}
      {loading ? (
        <div className="orders-loading-box">
          <span className="mini-spinner"></span>
          <p>Loading service testimonials database...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="empty-reviews-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <h3>No Reviews Found</h3>
          <p>No service reviews matching your active filters or search terms were found in our records.</p>
        </div>
      ) : (
        <div className="reviews-admin-grid">
          {filteredReviews.map(review => {
            const dateStr = new Date(review.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div key={review.id} className={`review-audit-card ${review.isVisible ? 'approved' : 'pending'}`}>
                {/* Status Badge */}
                <span className={`status-pill ${review.isVisible ? 'live' : 'moderating'}`}>
                  {review.isVisible ? 'Approved & Live' : 'Pending Review'}
                </span>

                {/* Review Header Card */}
                <div className="review-audit-header">
                  <div className="reviewer-avatar" style={{
                    background: `hsl(${((review.customer?.fullName || 'A').charCodeAt(0) * 47) % 360}, 50%, 35%)`
                  }}>
                    {(review.customer?.fullName || 'A')[0].toUpperCase()}
                  </div>
                  <div className="reviewer-details">
                    <h4>{review.customer?.fullName || 'Anonymous Customer'}</h4>
                    <span>{review.customer?.email || 'No email attached'}</span>
                  </div>
                </div>

                {/* Rating Info */}
                <div className="review-rating-row">
                  <StarRating rating={review.rating} size={16} />
                  <span className="review-date">{dateStr}</span>
                </div>

                {/* Comment Text */}
                <blockquote className="review-comment-quote">
                  "{review.comment || 'No textual feedback comment provided.'}"
                </blockquote>

                {/* Card CTA Actions */}
                <div className="review-audit-actions">
                  {review.isVisible ? (
                    <button 
                      onClick={() => handleToggleApproval(review.id, review.isVisible)}
                      className="btn-audit-hide"
                      disabled={processingId === review.id}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      <span>{processingId === review.id ? 'Hiding...' : 'Hide from Landing Page'}</span>
                    </button>
                  ) : (
                    <>
                      <button 
                        onClick={() => handleToggleApproval(review.id, review.isVisible)}
                        className="btn-audit-approve"
                        disabled={processingId === review.id}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>{processingId === review.id ? 'Approving...' : 'Approve Feedback'}</span>
                      </button>
                      <button 
                        onClick={() => handleToggleApproval(review.id, true)} 
                        style={{ display: 'none' }} // Hidden utility matching standard toggle
                      />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReviewManager;
