import React from 'react';
import CategoryGrid from '../components/CategoryGrid';

function CategoriesPage() {
  return (
    <div className="container" style={{ padding: '40px 15px', minHeight: '60vh' }}>
      <h1 style={{ marginBottom: '30px', fontSize: '28px' }}>Browse All Categories</h1>
      <CategoryGrid />
    </div>
  );
}

export default CategoriesPage;
