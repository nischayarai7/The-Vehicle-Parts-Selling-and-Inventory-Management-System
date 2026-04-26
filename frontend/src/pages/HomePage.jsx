import React from 'react';
import HeroSection from '../components/HeroSection';
import CategoryGrid from '../components/CategoryGrid';
import ProductGrid from '../components/ProductGrid';

function HomePage() {
  return (
    <div className="home-page">
      <HeroSection />
      <CategoryGrid />
      <ProductGrid />
    </div>
  );
}

export default HomePage;
