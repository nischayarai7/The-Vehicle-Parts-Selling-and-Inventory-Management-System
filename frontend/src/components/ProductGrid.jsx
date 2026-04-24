import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import './ProductGrid.css';

const ProductGrid = () => {
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);

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
          {parts.map((part) => (
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
                  {/* Placeholder rating */}
                  ★★★★★ <span className="rating-count">(5)</span>
                </div>
                <div className="product-price">Rs. {part.price.toFixed(2)}</div>
                <button className="add-to-cart-btn">Add to Cart</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductGrid;
