import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import './PartDetailPage.css';

function PartDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, showToast } = useCart();

  const [part, setPart] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  // Part Reviews States
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ fullName: '', rating: 5, comment: '' });
  const [hoverRating, setHoverRating] = useState(0);

  // Fitment Checker States
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [fitmentChecked, setFitmentChecked] = useState(false);
  const [doesFit, setDoesFit] = useState(null);

  // Image Gallery States
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchDetailData = async () => {
      try {
        setLoading(true);
        const partData = await api.getPartById(id);
        setPart(partData);

        const vehicleData = await api.getVehicles();
        setVehicles(vehicleData);
      } catch (err) {
        console.error('Failed to load part detail:', err);
        showToast('Failed to load product details.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchDetailData();
  }, [id]);

  useEffect(() => {
    if (part) {
      const local = localStorage.getItem(`part_reviews_${part.id}`);
      if (local) {
        setReviews(JSON.parse(local));
      } else {
        const mockReviews = [
          {
            id: `mock-1-${part.id}`,
            fullName: "Arjun Thapa",
            rating: 5,
            comment: `Absolutely brilliant! Fits my vehicle perfectly. Highly recommend this ${part.name}.`,
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: `mock-2-${part.id}`,
            fullName: "Sushant Rai",
            rating: 4,
            comment: `Quality materials, looks very premium. Shipping took two days but the packaging was excellent.`,
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          }
        ];
        localStorage.setItem(`part_reviews_${part.id}`, JSON.stringify(mockReviews));
        setReviews(mockReviews);
      }
    }
  }, [part]);

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!newReview.fullName || !newReview.comment) return;

    const reviewObj = {
      id: `review-${Date.now()}`,
      fullName: newReview.fullName,
      rating: newReview.rating,
      comment: newReview.comment,
      createdAt: new Date().toISOString()
    };

    const updatedReviews = [reviewObj, ...reviews];
    localStorage.setItem(`part_reviews_${part.id}`, JSON.stringify(updatedReviews));
    setReviews(updatedReviews);
    
    setNewReview({
      fullName: '',
      rating: 5,
      comment: ''
    });

    if (showToast) {
      showToast('Thank you! Your product review has been submitted.', 'success');
    }
  };

  if (loading) {
    return (
      <div className="detail-loading-container">
        <div className="spinner"></div>
        <p>Loading part catalog details...</p>
      </div>
    );
  }

  if (!part) {
    return (
      <div className="container not-found-container">
        <h2>Product Not Found</h2>
        <p>The part you are looking for does not exist or has been removed from the catalog.</p>
        <Link to="/shop" className="btn-primary">Back to Shop</Link>
      </div>
    );
  }

  // Formatting currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 2
    }).format(amount).replace('NPR', 'Rs.');
  };

  // Unique Lists for Fitment Dropdowns
  const makes = [...new Set(vehicles.map(v => v.make))].sort();
  const models = [...new Set(vehicles.filter(v => v.make === selectedMake).map(v => v.model))].sort();
  const years = [...new Set(vehicles.filter(v => v.make === selectedMake && v.model === selectedModel).map(v => v.year))].sort((a, b) => b - a);

  // Check vehicle compatibility
  const handleCheckFitment = (e) => {
    e.preventDefault();
    if (!selectedMake || !selectedModel || !selectedYear) {
      showToast('Please select all vehicle fields to check fitment.', 'info');
      return;
    }

    setFitmentChecked(true);

    // If the part is globally universal (no compatibility matches defined in DB)
    if (!part.compatibleVehicles || part.compatibleVehicles.length === 0) {
      setDoesFit(true);
      return;
    }

    // Check if the selected vehicle matches any compatible vehicle
    const isCompatible = part.compatibleVehicles.some(
      v => v.make.toLowerCase() === selectedMake.toLowerCase() &&
           v.model.toLowerCase() === selectedModel.toLowerCase() &&
           v.year.toString() === selectedYear.toString()
    );

    setDoesFit(isCompatible);
  };

  const handleResetFitment = () => {
    setSelectedMake('');
    setSelectedModel('');
    setSelectedYear('');
    setFitmentChecked(false);
    setDoesFit(null);
  };

  // Generate simulated thumbnail images
  const mainImage = part.imageUrl || `https://ui-avatars.com/api/?name=${part.name}&background=fff&color=e33b3b&size=500`;
  const galleryImages = [
    mainImage,
    part.imageUrl ? `${part.imageUrl}?index=1` : `https://ui-avatars.com/api/?name=${part.name}+angle+2&background=f9f9f9&color=e33b3b&size=500`,
    part.imageUrl ? `${part.imageUrl}?index=2` : `https://ui-avatars.com/api/?name=${part.name}+box+view&background=eaeaea&color=e33b3b&size=500`
  ];

  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  };

  const handleBuyItNow = () => {
    if (part.stockQuantity <= 0) {
      showToast('This item is currently out of stock.', 'error');
      return;
    }
    navigate(`/checkout?partId=${part.id}&quantity=${quantity}`);
  };

  return (
    <div className="container part-detail-page">
      {/* Dynamic Fitment Checker Banner */}
      <div className="fitment-banner-card">
        <div className="fitment-banner-header">
          <h3>Confirm Vehicle Fitment</h3>
          <p>We need more information about your vehicle to confirm fit.</p>
        </div>

        <form className="fitment-checker-form" onSubmit={handleCheckFitment}>
          <div className="fitment-select-group">
            <div className="select-wrapper">
              <label>Year</label>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)}
                disabled={!selectedModel}
              >
                <option value="">Select Year</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div className="select-wrapper">
              <label>Make</label>
              <select 
                value={selectedMake} 
                onChange={(e) => {
                  setSelectedMake(e.target.value);
                  setSelectedModel('');
                  setSelectedYear('');
                }}
              >
                <option value="">Select Make</option>
                {makes.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div className="select-wrapper">
              <label>Model</label>
              <select 
                value={selectedModel} 
                onChange={(e) => {
                  setSelectedModel(e.target.value);
                  setSelectedYear('');
                }}
                disabled={!selectedMake}
              >
                <option value="">Select Model</option>
                {models.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="fitment-action-buttons">
            <button type="submit" className="btn-apply-fitment">Check compatibility</button>
            {fitmentChecked && (
              <button type="button" className="btn-reset-fitment" onClick={handleResetFitment}>Clear</button>
            )}
          </div>
        </form>

        {/* Fitment Result Alert */}
        {fitmentChecked && (
          <div className={`fitment-result-alert ${doesFit ? 'alert-success' : 'alert-danger'}`}>
            <span className="alert-icon">{doesFit ? '✓' : '✗'}</span>
            <div className="alert-text">
              {doesFit ? (
                part.compatibleVehicles && part.compatibleVehicles.length > 0 ? (
                  <strong>Fits: This part is compatible with your {selectedYear} {selectedMake} {selectedModel}!</strong>
                ) : (
                  <strong>Universal Fit: This part is universally compatible and fits all vehicle models perfectly!</strong>
                )
              ) : (
                <strong>Does not fit: This part is not compatible with a {selectedYear} {selectedMake} {selectedModel}.</strong>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Two Column Layout */}
      <div className="part-detail-grid">
        {/* Left Column: Image Showcase */}
        <div className="part-detail-gallery">
          {/* Thumbnails rail */}
          <div className="gallery-thumbnails">
            {galleryImages.map((img, idx) => (
              <div 
                key={idx} 
                className={`thumbnail-item ${idx === activeImageIndex ? 'active' : ''}`}
                onClick={() => setActiveImageIndex(idx)}
              >
                <img 
                  src={img} 
                  alt={`Thumbnail ${idx + 1}`} 
                  onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${part.name}+view+${idx + 1}&background=fff&color=e33b3b` }}
                />
              </div>
            ))}
          </div>

          {/* Main Showcase Image */}
          <div className="main-image-display">
            <button className="carousel-btn prev-btn" onClick={handlePrevImage}>‹</button>
            <img 
              src={galleryImages[activeImageIndex]} 
              alt={part.name} 
              className="gallery-main-image"
              onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${part.name}&background=fff&color=e33b3b` }}
            />
            <button className="carousel-btn next-btn" onClick={handleNextImage}>›</button>

          </div>
        </div>

        {/* Right Column: Checkout & Details Column */}
        <div className="part-detail-purchase-panel">
          <div className="part-info-header">
            <span className="part-category-label">{part.categoryName}</span>
            <h1 className="part-main-title">{part.name}</h1>
            
            {(() => {
              const totalReviews = reviews.length;
              const avgRating = totalReviews > 0 
                ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
                : '5.0';
              const filledStars = '★'.repeat(Math.round(parseFloat(avgRating)));
              const emptyStars = '☆'.repeat(5 - Math.round(parseFloat(avgRating)));
              return (
                <div className="part-rating-stars" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontSize: '15px' }}>
                  <span>{filledStars}{emptyStars}</span>
                  <span className="rating-text" style={{ color: '#888', fontSize: '13px', fontWeight: '500' }}>
                    {avgRating} · {totalReviews} product review{totalReviews !== 1 ? 's' : ''}
                  </span>
                </div>
              );
            })()}
          </div>

          <div className="part-pricing-block" style={{ marginBottom: '16px' }}>
            <span className="price-tag">{formatCurrency(part.price)}</span>
            <span className="price-taxes-label">VAT / local taxes included</span>
          </div>

          {/* Special Loyalty Offer Banner */}
          <div className="discount-promo-banner" style={{ background: 'linear-gradient(135deg, rgba(227, 59, 59, 0.1) 0%, rgba(227, 179, 65, 0.05) 100%)', border: '1px solid rgba(227, 59, 59, 0.25)', borderRadius: '10px', padding: '14px 18px', marginBottom: '28px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="promo-icon" style={{ background: '#e33b3b', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="#fff" viewBox="0 0 16 16">
                <path d="M4 4.85v.9h.9v-.9H4Zm1.8 0v.9h.9v-.9h-.9Zm-1.8 1.8v.9h.9v-.9H4Zm1.8 0v.9h.9v-.9h-.9Z"/>
                <path d="M1.5 0A1.5 1.5 0 0 0 0 1.5v13A1.5 1.5 0 0 0 1.5 16h13a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 14.5 0h-13ZM1 1.5a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 .5.5v13a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5v-13Zm11 1.25a.75.75 0 0 0-1.5 0v10.5a.75.75 0 0 0 1.5 0V2.75Z"/>
              </svg>
            </div>
            <div className="promo-text">
              <strong style={{ color: '#e33b3b', fontSize: '13px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Special Loyalty Offer</strong>
              <span style={{ color: '#bbb', fontSize: '12.5px', lineHeight: '1.4' }}>Spend more than <strong>Rs. 5,000.00</strong> on your order and get an instant <strong>10% loyalty discount</strong> at checkout!</span>
            </div>
          </div>

          {/* Catalog Metadata Specs */}
          <div className="part-specs-table">
            <div className="spec-row">
              <span className="spec-label">Condition:</span>
              <span className="spec-value highlight-value">{part.condition || 'New'}</span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Brand:</span>
              <span className="spec-value">{part.brand || '6IX7EVEN Premium'}</span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Part Number:</span>
              <span className="spec-value code-value">{part.partNumber || 'N/A'}</span>
            </div>
            <div className="spec-row">
              <span className="spec-label">Availability:</span>
              <span className={`spec-value stock-value ${part.stockQuantity <= 0 ? 'out-of-stock' : part.stockQuantity <= part.reorderLevel ? 'low-stock' : 'in-stock'}`}>
                {part.stockQuantity <= 0 
                  ? 'Out of Stock' 
                  : part.stockQuantity <= part.reorderLevel 
                    ? `Low Stock (Only ${part.stockQuantity} left!)` 
                    : `In Stock (${part.stockQuantity} available)`
                }
              </span>
            </div>
          </div>

          {/* Description Section */}
          <div className="part-description-section">
            <h4>Description</h4>
            <p>{part.description || 'No additional description provided for this catalog inventory part.'}</p>
          </div>

          {/* Quantity Selector */}
          {part.stockQuantity > 0 && (
            <div className="detail-qty-row" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>Quantity:</span>
              <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '4px' }}>
                <button 
                  type="button" 
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: '#475569', fontSize: '18px', cursor: 'pointer', fontWeight: '600' }}
                >
                  -
                </button>
                <input 
                  type="text" 
                  readOnly
                  value={quantity}
                  style={{ width: '50px', background: 'none', border: 'none', color: '#0f172a', textAlign: 'center', fontSize: '15px', fontWeight: '700', outline: 'none' }}
                />
                <button 
                  type="button" 
                  onClick={() => setQuantity(prev => Math.min(part.stockQuantity, prev + 1))}
                  style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', color: '#475569', fontSize: '18px', cursor: 'pointer', fontWeight: '600' }}
                >
                  +
                </button>
              </div>
              <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                ({part.stockQuantity} units available)
              </span>
            </div>
          )}

          {/* Action Buy Buttons */}
          <div className="purchase-buttons-action">
            {part.stockQuantity <= 0 ? (
              <button className="btn-buy-now disabled" disabled>Out of Stock</button>
            ) : (
              <div style={{ display: 'flex', gap: '12px', width: '100%', alignItems: 'center' }}>
                <button className="btn-buy-now" onClick={handleBuyItNow} style={{ flex: 1, margin: 0 }}>
                  Buy It Now
                </button>
                <button 
                  className="btn-add-to-cart-icon" 
                  onClick={() => { addToCart(part, quantity); showToast(`${quantity}x ${part.name} added to cart!`, 'success'); }}
                  title="Add to cart"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5zM3.102 4l1.313 7h8.17l1.313-7H3.102zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Trust Guarantees */}
          <div className="detail-guarantees-grid">
            <div className="guarantee-item">
              <div className="guarantee-text">
                <strong>Return Policy:</strong> No returns, but backed by 6IX7EVEN replacement guarantee.
              </div>
            </div>
            <div className="guarantee-item">
              <div className="guarantee-text">
                <strong>Compatible Vehicles:</strong> Fits {part.compatibleVehicles && part.compatibleVehicles.length > 0 
                  ? part.compatibleVehicles.map(v => `${v.make} ${v.model}`).join(', ') 
                  : 'Universal / All vehicle models'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="part-reviews-container" style={{ marginTop: '56px', paddingTop: '40px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#fff', marginBottom: '28px', letterSpacing: '-0.3px' }}>Customer Reviews & Ratings</h3>
        
        <div className="reviews-section-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '56px' }}>
          {/* Reviews List */}
          <div className="reviews-list-col">
            <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Verified Buyer Feedback ({reviews.length})</h4>
            {reviews.length === 0 ? (
              <p style={{ color: '#888', fontStyle: 'italic' }}>No customer reviews yet. Be the first to share your experience!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {reviews.map((r, index) => (
                  <div key={r.id || index} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '20px', transition: 'transform 0.2s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <strong style={{ color: '#fff', fontSize: '14px', fontWeight: '600' }}>{r.fullName}</strong>
                      <span style={{ color: '#64748b', fontSize: '12px' }}>{new Date(r.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                    <div style={{ color: '#f59e0b', fontSize: '13px', marginBottom: '10px' }}>
                      {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: '13.5px', lineHeight: '1.5', margin: 0 }}>"{r.comment}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Review Form */}
          <div className="add-review-col" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '16px', padding: '32px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>Write a Customer Review</h4>
            <p style={{ fontSize: '13px', color: '#888', marginBottom: '24px' }}>Share your fitment, installation process, and performance experience with other buyers.</p>
            
            <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Your Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Nischaya Rai"
                  value={newReview.fullName}
                  onChange={(e) => setNewReview({ ...newReview, fullName: e.target.value })}
                  style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px 14px', color: '#fff', fontSize: '13.5px', outline: 'none', transition: 'border 0.2s' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Overall Rating</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReview({ ...newReview, rating: star })}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: star <= (hoverRating || newReview.rating) ? '#f59e0b' : '#222', fontSize: '26px', transition: 'color 0.1s' }}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Review Comments</label>
                <textarea 
                  required
                  rows="4"
                  placeholder="Describe vehicle fitment, installation process, or part quality..."
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '12px 14px', color: '#fff', fontSize: '13.5px', resize: 'vertical', outline: 'none', transition: 'border 0.2s' }}
                />
              </div>

              <button 
                type="submit"
                style={{ background: '#e33b3b', color: '#fff', border: 'none', borderRadius: '24px', height: '46px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', transition: 'background 0.2s', marginTop: '10px' }}
                onMouseEnter={(e) => e.target.style.background = '#c62e2e'}
                onMouseLeave={(e) => e.target.style.background = '#e33b3b'}
              >
                Submit Review
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PartDetailPage;
