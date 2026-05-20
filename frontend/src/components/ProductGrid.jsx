import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import './ProductGrid.css';

const ProductGrid = () => {
  const navigate = useNavigate();
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewAverages, setReviewAverages] = useState({});
  const { addToCart, showToast } = useCart();

  const handleBuyNow = (part) => {
    if (part.stockQuantity <= 0) {
      if (showToast) showToast('This item is currently out of stock.', 'error');
      return;
    }
    navigate(`/checkout?partId=${part.id}&quantity=1`);
  };

  useEffect(() => {
    const fetchPartsAndAverages = async () => {
      try {
        const [partsData, averagesData] = await Promise.all([
          api.getAllParts(),
          api.getPartReviewAverages().catch(() => [])
        ]);
        setParts(partsData);

        const averagesMap = {};
        if (Array.isArray(averagesData)) {
          averagesData.forEach(item => {
            averagesMap[item.partId] = {
              averageRating: item.averageRating,
              count: item.count
            };
          });
        }
        setReviewAverages(averagesMap);
      } catch (error) {
        console.error("Failed to fetch parts or averages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPartsAndAverages();
  }, []);

  const getCompatibilityText = (vehiclesList) => {
    if (!vehiclesList || vehiclesList.length === 0) return 'Universal';
    const displayList = vehiclesList.slice(0, 2).map(v => `${v.make} ${v.model}`).join(', ');
    if (vehiclesList.length > 2) {
      return `${displayList} (+${vehiclesList.length - 2} more)`;
    }
    return displayList;
  };

  const [activeTab, setActiveTab] = useState('New Arrival');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const getFilteredParts = () => {
    switch (activeTab) {
      case 'New Arrival':
        return [...parts].sort((a, b) => b.id - a.id).slice(0, 20);
      case 'Popular':
        return [...parts].sort((a, b) => {
          const ratingA = reviewAverages[a.id]?.averageRating || 0;
          const ratingB = reviewAverages[b.id]?.averageRating || 0;
          if (ratingB !== ratingA) return ratingB - ratingA;
          const countA = reviewAverages[a.id]?.count || 0;
          const countB = reviewAverages[b.id]?.count || 0;
          return countB - countA;
        }).slice(0, 20);
      case 'On Sale':
        return parts.filter(p => p.price < 3000).slice(0, 20);
      case 'Highest Price':
        return [...parts].sort((a, b) => b.price - a.price).slice(0, 20);
      case 'Lowest Price':
        return [...parts].sort((a, b) => a.price - b.price).slice(0, 20);
      case 'Featured':
      default:
        return parts.filter(p => p.price > 5000).slice(0, 20);
    }
  };

  const filteredParts = getFilteredParts();
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentParts = filteredParts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredParts.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    const section = document.querySelector('.product-section');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) return <div className="container"><p>Loading products...</p></div>;

  return (
    <section className="product-section">
      <div className="container">
        <div className="product-header category-section-header" style={{ marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
          <div className="section-header-left">
            <span className="section-eyebrow">Discover Premium Parts</span>
            <h2 className="section-title-modern">
              What We <span className="accent-text">Offer</span>
            </h2>
          </div>
          <div className="product-tabs" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            {['New Arrival', 'Featured', 'Popular', 'On Sale', 'Highest Price', 'Lowest Price'].map((tab) => (
              <button 
                key={tab}
                className={`tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {currentParts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <p>No components found in this category.</p>
          </div>
        ) : (
          <div className="product-grid">
            {currentParts.map((part) => (
              <div key={part.id} className="product-card">
              <Link to={`/shop/part/${part.id}`} className="product-image" style={{ background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', borderBottom: '1px solid var(--border-color)', textDecoration: 'none', overflow: 'hidden' }}>
                {part.imageUrl && !part.imageUrl.includes('unsplash') ? (
                  <img src={part.imageUrl} alt={part.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                )}
              </Link>
              <div className="product-info">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <p className="product-cat" style={{ margin: 0 }}>{part.categoryName}</p>
                  {part.isLowStock && <div className="badge low-stock" style={{ position: 'static' }}>Low Stock</div>}
                </div>
                <Link to={`/shop/part/${part.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                  <h3 className="product-title" style={{ cursor: 'pointer' }}>{part.name}</h3>
                </Link>
                <div style={{ fontSize: '11px', color: '#e33b3b', margin: '4px 0 10px 0', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16" style={{ flexShrink: 0, marginTop: '-1px' }}>
                    <path d="M4 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0zm8 0a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM0 6h16v1a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V6zm1.5-1.5A.5.5 0 0 1 2 4h12a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5H2a.5.5 0 0 1-.5-.5v-1z"/>
                    <path d="M2.52 3.862c.19-.626.78-1.056 1.436-1.056h8.088c.657 0 1.248.43 1.438 1.056l1.24 4.092c.09.296-.06.602-.34.697a.49.49 0 0 1-.606-.31L12.52 4.195a.498.498 0 0 0-.476-.34H3.956a.498.498 0 0 0-.476.34L2.24 8.286a.491.491 0 0 1-.607.31c-.28-.095-.43-.401-.34-.697l1.24-4.092z"/>
                  </svg>
                  <span>Fits: {getCompatibilityText(part.compatibleVehicles)}</span>
                </div>
                {(() => {
                  const ratingInfo = reviewAverages[part.id] || { averageRating: 0.0, count: 0 };
                  const avg = ratingInfo.averageRating;
                  const count = ratingInfo.count;
                  const filledStars = '★'.repeat(Math.round(avg));
                  const emptyStars = '☆'.repeat(5 - Math.round(avg));
                  return (
                    <div className="product-rating" style={{ fontSize: '12px', color: '#e3b341', margin: '4px 0 8px 0', display: 'flex', alignItems: 'center', gap: '3px' }}>
                      {count > 0 && (
                        <span style={{ color: '#e3b341', fontWeight: '700', marginRight: '3px' }}>{avg.toFixed(1)}</span>
                      )}
                      <span style={{ color: '#e3b341' }}>{filledStars}</span>
                      <span style={{ color: '#475569' }}>{emptyStars}</span>
                      <span className="rating-count" style={{ color: '#888', marginLeft: '4px' }}>({count})</span>
                    </div>
                  );
                })()}
                <div className="product-price">Rs. {part.price.toFixed(2)}</div>
                {part.stockQuantity <= 0 ? (
                  <button 
                    className="add-to-cart-btn disabled" 
                    disabled 
                    style={{ 
                      opacity: 0.5, 
                      cursor: 'not-allowed', 
                      width: '100%', 
                      height: '36px', 
                      fontSize: '13px', 
                      padding: '0 12px', 
                      margin: '10px 0 0 0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    Sold Out
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '8px', width: '100%', alignItems: 'center', marginTop: '10px' }}>
                    <button 
                      className="add-to-cart-btn" 
                      onClick={() => handleBuyNow(part)}
                      style={{ flex: 1, margin: 0, height: '36px', fontSize: '13px', padding: '0 12px' }}
                    >
                      Buy Now
                    </button>
                    <button 
                      className="btn-add-to-cart-icon-small" 
                      onClick={() => { addToCart(part); if (showToast) showToast(`${part.name} added!`, 'success'); }}
                      title="Add to cart"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5zM3.102 4l1.313 7h8.17l1.313-7H3.102zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        )}

        {/* Home Page Pagination Controls */}
        {filteredParts.length > 0 && totalPages > 1 && (
          <div className="home-pagination-container">
            <button 
              className="btn-home-pagination btn-home-pagination-nav" 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
              Prev
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button 
                key={`home-page-${page}`} 
                className={`btn-home-pagination ${currentPage === page ? 'active' : ''}`}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            ))}
            
            <button 
              className="btn-home-pagination btn-home-pagination-nav" 
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductGrid;
