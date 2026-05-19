import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { api } from '../../services/api';
import '../ShopPage.css'; // Reusing shop page styles

const RATING_LABELS = ['', 'Terrible', 'Poor', 'Average', 'Good', 'Excellent'];

const StarRating = ({ value, onChange, hoverValue, onHover, onLeave, size = 28, interactive = true }) => {
  return (
    <div style={{ display: 'flex', gap: '4px' }} onMouseLeave={onLeave}>
      {[1, 2, 3, 4, 5].map(star => {
        const isFilled = star <= (hoverValue || value);
        return (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onChange(star)}
            onMouseEnter={() => interactive && onHover(star)}
            style={{
              background: 'none', border: 'none', padding: '2px',
              cursor: interactive ? 'pointer' : 'default',
              transition: 'transform 0.15s ease',
              transform: interactive && star === hoverValue ? 'scale(1.25)' : 'scale(1)'
            }}
          >
            <svg
              width={size} height={size} viewBox="0 0 24 24"
              fill={isFilled ? '#e3b341' : 'none'}
              stroke={isFilled ? '#e3b341' : '#4a4a4a'}
              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              style={{
                filter: isFilled ? 'drop-shadow(0 0 4px rgba(227, 179, 65, 0.4))' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        );
      })}
    </div>
  );
};

const ReviewsPage = () => {
  const { user } = useSelector((state) => state.auth);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lastUserReview, setLastUserReview] = useState(null);
  const [daysRemaining, setDaysRemaining] = useState(0);
  
  const [formData, setFormData] = useState({
    rating: 0,
    comment: '',
    appointmentId: null
  });

  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const [approvedReviews, lastReview] = await Promise.all([
        api.getServiceReviews(),
        api.getMyLastServiceReview().catch(() => null)
      ]);
      
      setReviews(approvedReviews || []);
      setLastUserReview(lastReview);

      if (lastReview) {
        const lastDate = new Date(lastReview.createdAt);
        const diffTime = Math.abs(new Date() - lastDate);
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        if (diffDays < 30) {
          setDaysRemaining(Math.ceil(30 - diffDays));
        } else {
          setDaysRemaining(0);
        }
      } else {
        setDaysRemaining(0);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      setLoading(true);
      await api.deleteServiceReview(reviewId);
      setMessage({ text: "Your review has been successfully deleted.", type: "success" });
      
      // Auto-clear message
      setTimeout(() => setMessage({ text: '', type: '' }), 4000);
      
      // Refresh review list & recalculate 30-day throttle eligibility
      await fetchReviews();
    } catch (err) {
      console.error("Failed to delete review:", err);
      setMessage({ text: err?.message || "Failed to delete review.", type: "error" });
      setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (daysRemaining > 0) {
      setMessage({ text: `You can only submit one review per month. Please try again in ${daysRemaining} days.`, type: 'error' });
      setTimeout(() => setMessage({ text: '', type: '' }), 4000);
      return;
    }
    if (formData.rating < 1 || formData.rating > 5) {
      setMessage({ text: 'Please select a rating before submitting.', type: 'error' });
      setTimeout(() => setMessage({ text: '', type: '' }), 4000);
      return;
    }
    if (!formData.comment.trim()) {
      setMessage({ text: 'Please write a comment before submitting.', type: 'error' });
      setTimeout(() => setMessage({ text: '', type: '' }), 4000);
      return;
    }

    try {
      setSubmitting(true);
      const result = await api.createServiceReview(formData);
      
      // Use the elegant, customized success message returned by the server, or fallback
      const successText = result?.message || 'Your review has been submitted successfully! It has been sent to our administration for review and approval.';
      setMessage({ text: successText, type: 'success' });
      
      setTimeout(() => setMessage({ text: '', type: '' }), 8000); // Give user plenty of time to read
      setFormData({ rating: 0, comment: '', appointmentId: null });
      setHoverRating(0);
      
      // Refresh reviews and eligibility state
      await fetchReviews();
    } catch (err) {
      console.error('Failed to submit review:', err);
      setMessage({ text: err?.message || 'Failed to submit review. Please try again.', type: 'error' });
      setTimeout(() => setMessage({ text: '', type: '' }), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate average rating
  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';
  const ratingCounts = [0, 0, 0, 0, 0];
  reviews.forEach(r => { if (r.rating >= 1 && r.rating <= 5) ratingCounts[r.rating - 1]++; });

  if (loading) {
    return (
      <div className="spinner-wrapper">
        <div className="loading-spinner"></div>
        <p style={{ marginTop: '16px' }}>Loading reviews...</p>
      </div>
    );
  }

  const activeLabel = RATING_LABELS[hoverRating || formData.rating] || '';

  return (
    <div>
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(120%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .premium-toast-container {
          position: fixed;
          top: 30px;
          right: 30px;
          z-index: 99999;
          padding: 16px 20px;
          border-radius: 12px;
          background: rgba(22, 27, 34, 0.95);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: flex-start;
          gap: 14px;
          animation: slideInRight 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          max-width: 440px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.3s ease;
        }
        .premium-toast-container.success {
          border-left: 4px solid #2ea043;
        }
        .premium-toast-container.error {
          border-left: 4px solid #f85149;
        }
        .toast-icon-box {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .toast-icon-box.success {
          background: rgba(46, 160, 67, 0.15);
          color: #3fb950;
        }
        .toast-icon-box.error {
          background: rgba(248, 81, 73, 0.15);
          color: #f85149;
        }
        .toast-text-box {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .toast-heading {
          font-weight: 700;
          font-size: 13.5px;
          color: #f0f6fc;
          letter-spacing: 0.1px;
          text-transform: uppercase;
        }
        .toast-body-desc {
          font-size: 12.5px;
          color: #8b949e;
          line-height: 1.5;
          margin: 0;
        }

        /* Confirmation Modal Styles */
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalScaleUp {
          from {
            transform: scale(0.9) translateY(20px);
            opacity: 0;
          }
          to {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 100000;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: modalFadeIn 0.25s ease forwards;
        }
        .premium-confirm-modal {
          background: #161b22;
          border: 1px solid #30363d;
          border-radius: 16px;
          padding: 28px;
          width: 90%;
          max-width: 420px;
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.7);
          animation: modalScaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .warning-icon-wrapper {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(224, 79, 95, 0.12);
          color: #e04f5f;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          box-shadow: 0 0 20px rgba(224, 79, 95, 0.1);
        }
        .modal-title {
          font-size: 18px;
          font-weight: 700;
          color: #f0f6fc;
          margin-bottom: 10px;
        }
        .modal-body {
          font-size: 13.5px;
          color: #8b949e;
          line-height: 1.6;
          margin: 0 0 26px 0;
        }
        .modal-actions {
          display: flex;
          gap: 12px;
          width: 100%;
        }
        .modal-btn {
          flex: 1;
          padding: 11px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid transparent;
          outline: none;
        }
        .modal-btn.cancel {
          background: #21262d;
          border-color: #30363d;
          color: #c9d1d9;
        }
        .modal-btn.cancel:hover {
          background: #30363d;
          color: #f0f6fc;
        }
        .modal-btn.confirm {
          background: linear-gradient(135deg, #e04f5f 0%, #b23b47 100%);
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(224, 79, 95, 0.3);
        }
        .modal-btn.confirm:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(224, 79, 95, 0.45);
        }
        .modal-btn.confirm:active {
          transform: translateY(0);
        }
      `}</style>

      {/* Floating premium toast */}
      {message.text && (
        <div className={`premium-toast-container ${message.type}`}>
          <div className={`toast-icon-box ${message.type}`}>
            {message.type === 'success' ? (
              <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            ) : (
              <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>
                <circle cx="12" cy="12" r="10"></circle>
              </svg>
            )}
          </div>
          <div className="toast-text-box">
            <span className="toast-heading">{message.type === 'success' ? 'Success Notification' : 'Attention Required'}</span>
            <p className="toast-body-desc">{message.text}</p>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmDeleteId !== null && (
        <div className="modal-overlay">
          <div className="premium-confirm-modal">
            <div className="warning-icon-wrapper">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <h3 className="modal-title">Delete Review?</h3>
            <p className="modal-body">
              Are you sure you want to permanently delete your service review? This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button 
                type="button" 
                className="modal-btn cancel" 
                onClick={() => setConfirmDeleteId(null)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="modal-btn confirm" 
                onClick={async () => {
                  const id = confirmDeleteId;
                  setConfirmDeleteId(null);
                  await handleDeleteReview(id);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <h1>Service Reviews</h1>
      <p style={{ color: '#888', marginBottom: '24px' }}>Share your experience with our services or read what other customers have to say.</p>

      {/* Rating Summary Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '30px', padding: '20px 24px',
        background: '#161b22', borderRadius: '12px', border: '1px solid #21262d', marginBottom: '30px'
      }}>
        <div style={{ textAlign: 'center', minWidth: '90px' }}>
          <div style={{ fontSize: '42px', fontWeight: '800', color: '#e3b341', lineHeight: '1' }}>{avgRating}</div>
          <StarRating value={Math.round(parseFloat(avgRating))} onChange={() => {}} hoverValue={0} onHover={() => {}} onLeave={() => {}} size={16} interactive={false} />
          <div style={{ color: '#8b949e', fontSize: '12px', marginTop: '4px' }}>{reviews.length} review{reviews.length !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {[5, 4, 3, 2, 1].map(star => {
            const count = ratingCounts[star - 1];
            const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
            return (
              <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#8b949e', fontSize: '12px', width: '12px', textAlign: 'right' }}>{star}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#e3b341" stroke="none">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <div style={{ flex: 1, height: '6px', background: '#21262d', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #e3b341, #f0d060)',
                    borderRadius: '3px', transition: 'width 0.4s ease'
                  }} />
                </div>
                <span style={{ color: '#8b949e', fontSize: '11px', width: '24px' }}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* Form Section */}
        <div className="large-card">
          <h3 style={{ marginBottom: '20px' }}>Leave a Review</h3>

          <form onSubmit={handleSubmit}>
            {daysRemaining > 0 && (
              <div style={{
                background: 'rgba(224, 79, 95, 0.08)',
                border: '1px solid rgba(224, 79, 95, 0.2)',
                color: '#e04f5f',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '24px',
                fontSize: '13px',
                lineHeight: '1.6',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}>
                <svg style={{ width: '18px', height: '18px', flexShrink: 0, marginTop: '2px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <div>
                  <strong style={{ display: 'block', marginBottom: '4px', fontWeight: '700' }}>Monthly Review Limit Reached</strong>
                  You can only submit one service review per month to maintain feedback integrity. You will be eligible to share your next review in <strong>{daysRemaining} days</strong>.
                </div>
              </div>
            )}

            {/* Interactive Star Selector */}
            <div style={{ marginBottom: '24px', opacity: daysRemaining > 0 ? 0.5 : 1 }}>
              <label style={{ display: 'block', marginBottom: '10px', color: '#888', fontSize: '13px' }}>How would you rate our service?</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <StarRating
                  value={formData.rating}
                  onChange={(val) => setFormData(prev => ({ ...prev, rating: val }))}
                  hoverValue={hoverRating}
                  onHover={setHoverRating}
                  onLeave={() => setHoverRating(0)}
                  size={36}
                  interactive={daysRemaining === 0}
                />
                {activeLabel && (
                  <span style={{
                    fontSize: '13px', fontWeight: '600', padding: '4px 12px',
                    borderRadius: '20px', background: 'rgba(227, 179, 65, 0.1)',
                    color: '#e3b341', border: '1px solid rgba(227, 179, 65, 0.25)',
                    transition: 'all 0.2s ease'
                  }}>
                    {activeLabel}
                  </span>
                )}
              </div>
            </div>

            {/* Comment */}
            <div style={{ marginBottom: '20px', opacity: daysRemaining > 0 ? 0.5 : 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#888', fontSize: '13px' }}>Your feedback</label>
              <textarea
                name="comment"
                value={formData.comment}
                onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                disabled={daysRemaining > 0}
                style={{
                  width: '100%', padding: '12px', background: '#0d1117',
                  border: '1px solid #2f363d', borderRadius: '8px', color: '#fff',
                  minHeight: '120px', fontSize: '14px', lineHeight: '1.6',
                  transition: 'border-color 0.2s ease', resize: 'vertical'
                }}
                placeholder={daysRemaining > 0 ? "You have already reviewed us this month." : "Tell us about your experience — what went well, what could be improved..."}
                onFocus={(e) => e.currentTarget.style.borderColor = '#e3b341'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#2f363d'}
              />
              <div style={{ textAlign: 'right', fontSize: '11px', color: '#4a4a4a', marginTop: '4px' }}>
                {formData.comment.length} / 500
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || formData.rating === 0 || daysRemaining > 0}
              style={{
                width: '100%', padding: '14px', borderRadius: '8px',
                background: (submitting || formData.rating === 0 || daysRemaining > 0) ? '#21262d' : 'linear-gradient(135deg, #2ea043 0%, #238636 100%)',
                color: (submitting || formData.rating === 0 || daysRemaining > 0) ? '#8b949e' : '#ffffff',
                border: (submitting || formData.rating === 0 || daysRemaining > 0) ? '1px solid #30363d' : '1px solid rgba(240,246,252,0.1)',
                fontSize: '15px', fontWeight: '600',
                cursor: (submitting || formData.rating === 0 || daysRemaining > 0) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: (submitting || formData.rating === 0 || daysRemaining > 0) ? 'none' : '0 4px 12px rgba(46, 160, 67, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (!submitting && formData.rating > 0 && daysRemaining === 0) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(46, 160, 67, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = (formData.rating > 0 && daysRemaining === 0) ? '0 4px 12px rgba(46, 160, 67, 0.3)' : 'none';
              }}
            >
              {submitting ? 'Submitting...' : daysRemaining > 0 ? 'Monthly Limit Reached' : 'Submit Review'}
            </button>
          </form>
        </div>

        {/* Reviews List */}
        <div className="large-card">
          <h3 style={{ marginBottom: '20px' }}>Recent Reviews</h3>

          <div style={{ maxHeight: '520px', overflowY: 'auto', paddingRight: '4px' }}>
            {reviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#4a4a4a' }}>
                <svg style={{ width: '48px', height: '48px', marginBottom: '12px', opacity: 0.4 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <p style={{ fontSize: '14px' }}>No reviews yet. Be the first to share your experience.</p>
              </div>
            ) : (
              reviews.map((r, idx) => (
                <div
                  key={r.id}
                  style={{
                    padding: '16px', marginBottom: '12px',
                    background: '#161b22', borderRadius: '10px',
                    border: '1px solid #21262d',
                    transition: 'border-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#30363d'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#21262d'}
                >
                  {/* Header row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {/* Avatar circle */}
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '50%',
                        background: `hsl(${((r.customer?.fullName || 'A').charCodeAt(0) * 47) % 360}, 50%, 35%)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '13px', fontWeight: '700', color: '#fff'
                      }}>
                        {(r.customer?.fullName || 'A')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: '600', color: '#c9d1d9', fontSize: '14px' }}>
                            {r.customer?.fullName || 'Anonymous'}
                          </span>
                          {user && r.customer && r.customer.email === user.email && (
                            <span style={{ fontSize: '9px', background: 'rgba(224, 79, 95, 0.12)', color: '#e04f5f', padding: '1px 5px', borderRadius: '4px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                              You
                            </span>
                          )}
                        </div>
                        <div style={{ color: '#4a4a4a', fontSize: '11px' }}>
                          {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <StarRating value={r.rating} onChange={() => {}} hoverValue={0} onHover={() => {}} onLeave={() => {}} size={14} interactive={false} />
                      {user && r.customer && r.customer.email === user.email && (
                        <button
                          onClick={() => setConfirmDeleteId(r.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: '4px',
                            color: '#8b949e',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                            outline: 'none'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#ef4444';
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#8b949e';
                            e.currentTarget.style.background = 'none';
                          }}
                          title="Delete your review"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  {/* Comment */}
                  {r.comment && (
                    <p style={{ color: '#8b949e', margin: 0, fontSize: '13px', lineHeight: '1.6' }}>{r.comment}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewsPage;
