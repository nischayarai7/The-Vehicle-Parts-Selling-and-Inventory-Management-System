import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import './ProductGrid.css';

const ProductGrid = () => {
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

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
              <div className="product-img-wrapper">
                <img 
                  src={part.imageUrl || `https://ui-avatars.com/api/?name=${part.name}&background=fff&color=e33b3b&size=250`} 
                  alt={part.name} 
                  onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${part.name}&background=fff&color=e33b3b&size=250` }}
                />
              </div>
              <div className="product-info">
                <p className="product-cat">{part.categoryName}</p>
                <h3 className="product-title">{part.name}</h3>
                <div className="product-rating">
                  ★★★★★ <span className="rating-count">(5)</span>
                </div>
                <div className="product-price">Rs. {part.price.toFixed(2)}</div>
                <button className="add-to-cart-btn" onClick={() => addToCart(part)}>Add to Cart</button>
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
