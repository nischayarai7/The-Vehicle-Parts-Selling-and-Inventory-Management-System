import React from 'react';
import HeroSection from '../components/HeroSection';
import CategoryGrid from '../components/CategoryGrid';
import ProductGrid from '../components/ProductGrid';
import TestimonialSection from '../components/TestimonialSection';

function HomePage() {
  return (
    <div className="home-page">
      <HeroSection />
      <CategoryGrid />
      <ProductGrid />
      <TestimonialSection />
    </div>
  );
}

export default HomePage;
