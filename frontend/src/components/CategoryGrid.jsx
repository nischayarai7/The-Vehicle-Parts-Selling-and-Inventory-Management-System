import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import './CategoryGrid.css';

const CategoryGrid = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await api.getActiveCategories();
        setCategories(data);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) return <div className="container"><p>Loading categories...</p></div>;

  // We'll map the actual categories to match the grid style
  return (
    <section className="category-section">
      <div className="container">
        <h2 className="section-title">Shop by Category</h2>
        <div className="category-grid">
          {categories.map((category) => (
            <div key={category.id} className="category-card">
              <div className="category-img-wrapper">
                {/* Fallback image if category.imageUrl is missing or invalid */}
                <img 
                  src={category.imageUrl || `https://ui-avatars.com/api/?name=${category.name}&background=f1f1f1&color=e33b3b&size=200`} 
                  alt={category.name} 
                  onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${category.name}&background=f1f1f1&color=e33b3b&size=200` }}
                />
              </div>
              <div className="category-info">
                <h3>{category.name}</h3>
                <p>{category.description || 'Explore parts'}</p>
                <a href={`/category/${category.id}`} className="shop-link">Shop Now</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;
