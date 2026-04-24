import React from 'react';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import CategoryGrid from '../components/CategoryGrid';
import ProductGrid from '../components/ProductGrid';
import Footer from '../components/Footer';

function HomePage() {
  return (
    <div className="home-page">
      <Navbar />
      <main>
        <HeroSection />
        <CategoryGrid />
        <ProductGrid />
      </main>
      <Footer />
    </div>
  );
}

export default HomePage;
