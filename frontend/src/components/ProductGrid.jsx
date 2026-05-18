import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import './ProductGrid.css';

const ProductGrid = () => {
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart, showToast } = useCart();

  const handleBuyNow = (part) => {
    if (part.stockQuantity <= 0) {
      if (showToast) showToast('This item is currently out of stock.', 'error');
      return;
    }
    addToCart(part);
    if (showToast) showToast('Item ready for checkout!', 'success');
  };

  useEffect(() => {
    const fetchParts = async () => {
      try {
        const data = await api.getAllParts();
        setParts(data);
      } catch (error) {
        console.error("Failed to fetch parts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchParts();
  }, []);

  const getCompatibilityText = (vehiclesList) => {
    if (!vehiclesList || vehiclesList.length === 0) return 'Universal';
    const displayList = vehiclesList.slice(0, 2).map(v => `${v.make} ${v.model}`).join(', ');
    if (vehiclesList.length > 2) {
      return `${displayList} (+${vehiclesList.length - 2} more)`;
    }
    return displayList;
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const newArrivalParts = parts.slice(0, 20);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentParts = newArrivalParts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(newArrivalParts.length / itemsPerPage);

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
        <div className="product-header">
          <h2 className="section-title">What We Offer</h2>
          <div className="product-tabs">
            <button className="tab active">New Arrival</button>
            <button className="tab">Featured</button>
            <button className="tab">Popular</button>
            <button className="tab">On Sale</button>
          </div>
        </div>

        <div className="product-grid">
          {currentParts.map((part) => (
            <div key={part.id} className="product-card">
              {part.isLowStock && <div className="badge low-stock">Low Stock</div>}
              <Link to={`/shop/part/${part.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                <div className="product-img-wrapper">
                  <img 
                    src={part.imageUrl || `https://ui-avatars.com/api/?name=${part.name}&background=fff&color=e33b3b&size=250`} 
                    alt={part.name} 
                    onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${part.name}&background=fff&color=e33b3b&size=250` }}
                  />
                </div>
              </Link>
              <div className="product-info">
                <p className="product-cat">{part.categoryName}</p>
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
                <div className="product-rating">
                  ★★★★★ <span className="rating-count">(5)</span>
                </div>
                <div className="product-price">Rs. {part.price.toFixed(2)}</div>
                {part.stockQuantity <= 0 ? (
                  <button className="add-to-cart-btn disabled" disabled style={{ opacity: 0.5, cursor: 'not-allowed', width: '100%' }}>
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
                      style={{ 
                        width: '36px', 
                        height: '36px', 
                        borderRadius: '6px', 
                        border: '1px solid #e33b3b', 
                        background: 'transparent', 
                        color: '#e33b3b', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        cursor: 'pointer',
                        padding: 0
                      }}
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

        {/* Home Page Pagination Controls */}
        {newArrivalParts.length > 0 && totalPages > 1 && (
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
