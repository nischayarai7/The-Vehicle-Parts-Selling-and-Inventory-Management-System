import React, { useState, useEffect } from 'react';
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
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    rating: 0,
    comment: '',
    appointmentId: null
  });

  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const data = await api.getServiceReviews();
      setReviews(data);
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      await api.createServiceReview(formData);
      setMessage({ text: 'Review submitted successfully!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 4000);
      setFormData({ rating: 0, comment: '', appointmentId: null });
      setHoverRating(0);
      fetchReviews();
    } catch (err) {
      console.error('Failed to submit review:', err);
      setMessage({ text: err?.message || 'Failed to submit review. Please try again.', type: 'error' });
      setTimeout(() => setMessage({ text: '', type: '' }), 4000);
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
      {/* Floating toast */}
      {message.text && (
        <div style={{
          position: 'fixed', top: '30px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
          padding: '12px 24px', borderRadius: '8px', background: '#161b22',
          color: message.type === 'success' ? '#3fb950' : '#f85149',
          border: `1px solid ${message.type === 'success' ? 'rgba(63, 185, 80, 0.4)' : 'rgba(248, 81, 73, 0.4)'}`,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)', fontSize: '14px', fontWeight: '500',
          display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          {message.type === 'success' ? (
            <svg style={{ width: '18px', height: '18px', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          ) : (
            <svg style={{ width: '18px', height: '18px', flexShrink: 0 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          )}
          {message.text}
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
            {/* Interactive Star Selector */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '10px', color: '#888', fontSize: '13px' }}>How would you rate our service?</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <StarRating
                  value={formData.rating}
                  onChange={(val) => setFormData(prev => ({ ...prev, rating: val }))}
                  hoverValue={hoverRating}
                  onHover={setHoverRating}
                  onLeave={() => setHoverRating(0)}
                  size={36}
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
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#888', fontSize: '13px' }}>Your feedback</label>
              <textarea
                name="comment"
                value={formData.comment}
                onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                style={{
                  width: '100%', padding: '12px', background: '#0d1117',
                  border: '1px solid #2f363d', borderRadius: '8px', color: '#fff',
                  minHeight: '120px', fontSize: '14px', lineHeight: '1.6',
                  transition: 'border-color 0.2s ease', resize: 'vertical'
                }}
                placeholder="Tell us about your experience — what went well, what could be improved..."
                onFocus={(e) => e.currentTarget.style.borderColor = '#e3b341'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#2f363d'}
              />
              <div style={{ textAlign: 'right', fontSize: '11px', color: '#4a4a4a', marginTop: '4px' }}>
                {formData.comment.length} / 500
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || formData.rating === 0}
              style={{
                width: '100%', padding: '14px', borderRadius: '8px',
                background: (submitting || formData.rating === 0) ? '#21262d' : 'linear-gradient(135deg, #2ea043 0%, #238636 100%)',
                color: (submitting || formData.rating === 0) ? '#8b949e' : '#ffffff',
                border: (submitting || formData.rating === 0) ? '1px solid #30363d' : '1px solid rgba(240,246,252,0.1)',
                fontSize: '15px', fontWeight: '600',
                cursor: (submitting || formData.rating === 0) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: (submitting || formData.rating === 0) ? 'none' : '0 4px 12px rgba(46, 160, 67, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (!submitting && formData.rating > 0) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(46, 160, 67, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = formData.rating > 0 ? '0 4px 12px rgba(46, 160, 67, 0.3)' : 'none';
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
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
                        <div style={{ fontWeight: '600', color: '#c9d1d9', fontSize: '14px' }}>
                          {r.customer?.fullName || 'Anonymous'}
                        </div>
                        <div style={{ color: '#4a4a4a', fontSize: '11px' }}>
                          {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    <StarRating value={r.rating} onChange={() => {}} hoverValue={0} onHover={() => {}} onLeave={() => {}} size={14} interactive={false} />
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
