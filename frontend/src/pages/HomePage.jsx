import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import HeroSection from '../components/HeroSection';
import CategoryGrid from '../components/CategoryGrid';
import ProductGrid from '../components/ProductGrid';
import TestimonialSection from '../components/TestimonialSection';
import AboutPage from './AboutPage';
import ContactPage from './ContactPage';

function HomePage() {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        // Delay slightly to ensure page components are fully rendered
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [location]);

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
