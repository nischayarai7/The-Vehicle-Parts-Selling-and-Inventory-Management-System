import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const StoreLayout = () => {
  return (
    <div className="store-layout">
      <Navbar />
      <main className="store-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default StoreLayout;
