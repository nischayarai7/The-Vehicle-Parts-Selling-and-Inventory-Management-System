import React from 'react';
import './ShopPage.css';

const dummyProducts = [
  { id: 1, name: 'High-Performance Brake Kit', price: '$249.99', category: 'Brakes', image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=600&auto=format&fit=crop' },
  { id: 2, name: 'V8 Engine Block', price: '$1,299.00', category: 'Engine', image: 'https://images.unsplash.com/photo-1527383214149-8ba99e26ffb5?q=80&w=600&auto=format&fit=crop' },
  { id: 3, name: 'Alloy Wheels Set', price: '$799.50', category: 'Wheels', image: 'https://images.unsplash.com/photo-1622384732152-73a4b7c6883e?q=80&w=600&auto=format&fit=crop' },
  { id: 4, name: 'Premium Motor Oil', price: '$45.00', category: 'Fluids', image: 'https://images.unsplash.com/photo-1620805175902-6019623e1e07?q=80&w=600&auto=format&fit=crop' },
  { id: 5, name: 'LED Headlight Conversion', price: '$120.00', category: 'Lighting', image: 'https://images.unsplash.com/photo-1542282088-fe8426682b8f?q=80&w=600&auto=format&fit=crop' },
  { id: 6, name: 'Sport Suspension Kit', price: '$540.00', category: 'Suspension', image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?q=80&w=600&auto=format&fit=crop' },
];

function ShopPage() {
  return (
    <div className="container shop-page">
      <div className="shop-header">
        <h1>All Parts</h1>
        <div className="shop-filters">
          <select>
            <option>All Categories</option>
            <option>Brakes</option>
            <option>Engine</option>
            <option>Wheels</option>
          </select>
          <select>
            <option>Sort by: Featured</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
          </select>
        </div>
      </div>

      <div className="shop-grid">
        {dummyProducts.map((product) => (
          <div key={product.id} className="product-card">
            <div className="product-image-wrapper">
              <img src={product.image} alt={product.name} className="product-image" />
              <div className="product-category-tag">{product.category}</div>
            </div>
            <div className="product-info">
              <h3>{product.name}</h3>
              <div className="product-price-row">
                <span className="price">{product.price}</span>
                <button className="btn-primary add-to-cart-btn">Add to Cart</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ShopPage;
