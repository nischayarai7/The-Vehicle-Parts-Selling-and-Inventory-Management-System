import React from 'react';
import { useSelector } from 'react-redux';
import HeroSection from '../components/HeroSection';
import CategoryGrid from '../components/CategoryGrid';
import ProductGrid from '../components/ProductGrid';
import TestimonialSection from '../components/TestimonialSection';
import AboutPage from './AboutPage';
import ContactPage from './ContactPage';

function HomePage() {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <div className="home-page">
      <HeroSection />
      <CategoryGrid />
      <ProductGrid />
      
      {!isAuthenticated && (
        <>
          <div id="about">
            <AboutPage />
          </div>

          <div id="contact">
            <ContactPage />
          </div>
        </>
      )}

      <div id="feedback">
        <TestimonialSection />
      </div>
    </div>
  );
}

export default HomePage;
