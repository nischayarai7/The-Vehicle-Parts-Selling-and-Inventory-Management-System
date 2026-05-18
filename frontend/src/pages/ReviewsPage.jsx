import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import './ShopPage.css'; // Reusing shop page styles

const ReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    rating: 5,
    comment: '',
    appointmentId: null
  });

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.rating < 1 || formData.rating > 5) {
      setMessage({ text: 'Rating must be between 1 and 5.', type: 'error' });
      return;
    }

    try {
      setSubmitting(true);
      await api.createServiceReview(formData);
      setMessage({ text: 'Review submitted successfully!', type: 'success' });
      setFormData({ rating: 5, comment: '', appointmentId: null });
      fetchReviews(); // Refresh list
    } catch (err) {
      console.error('Failed to submit review:', err);
      setMessage({ text: 'Failed to submit review. Please try again.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  if (loading) {
    return (
      <div className="spinner-wrapper">
        <div className="loading-spinner"></div>
        <p style={{ marginTop: '16px' }}>Loading reviews...</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Service Reviews</h1>
      <p style={{ color: '#888', marginBottom: '24px' }}>See what our customers say about us or leave your own review.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* Form Section */}
        <div className="large-card">
          <h3>Leave a Review</h3>
          
          {message.text && (
            <div style={{ 
              padding: '10px', 
              borderRadius: '4px', 
              marginBottom: '15px',
              background: message.type === 'success' ? 'rgba(46, 160, 67, 0.15)' : 'rgba(248, 81, 73, 0.15)',
              color: message.type === 'success' ? '#3fb950' : '#f85149',
              border: `1px solid ${message.type === 'success' ? '#2ea043' : '#f85149'}`
            }}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#888' }}>Rating</label>
              <select
                name="rating"
                value={formData.rating}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '10px', background: '#0d1117', border: '1px solid #2f363d', borderRadius: '6px', color: '#fff' }}
              >
                <option value={5}>5 Stars - Excellent</option>
                <option value={4}>4 Stars - Good</option>
                <option value={3}>3 Stars - Average</option>
                <option value={2}>2 Stars - Poor</option>
                <option value={1}>1 Star - Terrible</option>
              </select>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#888' }}>Comment</label>
              <textarea
                name="comment"
                value={formData.comment}
                onChange={handleInputChange}
                style={{ width: '100%', padding: '10px', background: '#0d1117', border: '1px solid #2f363d', borderRadius: '6px', color: '#fff', minHeight: '100px' }}
                placeholder="Share your experience..."
              />
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              style={{ width: '100%' }}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>

        {/* List Section */}
        <div className="large-card">
          <h3>Recent Reviews</h3>
          
          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {reviews.length === 0 ? (
              <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>No reviews yet.</p>
            ) : (
              reviews.map((r) => (
                <div key={r.id} style={{ borderBottom: '1px solid #222', padding: '15px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <span style={{ fontWeight: '600', color: '#fff' }}>{r.customer?.fullName || 'Anonymous'}</span>
                    <span style={{ color: '#e3b33b' }}>{renderStars(r.rating)}</span>
                  </div>
                  <p style={{ color: '#aaa', margin: '5px 0', fontSize: '14px' }}>{r.comment}</p>
                  <small style={{ color: '#555' }}>{new Date(r.createdAt).toLocaleDateString()}</small>
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
