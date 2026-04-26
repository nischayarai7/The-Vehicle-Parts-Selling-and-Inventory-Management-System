import React from 'react';

function AboutPage() {
  return (
    <div className="container" style={{ padding: '60px 15px', minHeight: '60vh', maxWidth: '800px' }}>
      <h1 style={{ fontSize: '36px', marginBottom: '20px', color: 'var(--text-main)' }}>About 6IX7EVEN</h1>
      <p style={{ fontSize: '18px', color: 'var(--text-muted)', lineHeight: '1.8', marginBottom: '30px' }}>
        Welcome to 6IX7EVEN Auto Parts, your premium destination for high-quality vehicle components and accessories. 
        We specialize in providing top-tier parts for enthusiasts and daily drivers alike, ensuring performance, reliability, and style.
      </p>
      
      <img 
        src="https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=1200&auto=format&fit=crop" 
        alt="About Us" 
        style={{ width: '100%', height: '400px', objectFit: 'cover', borderRadius: '8px', marginBottom: '40px' }} 
      />

      <h2 style={{ fontSize: '24px', marginBottom: '15px' }}>Our Mission</h2>
      <p style={{ fontSize: '16px', color: 'var(--text-main)', lineHeight: '1.7' }}>
        Our mission is to revolutionize the auto parts industry by providing an unmatched inventory paired with 
        expert knowledge and a seamless online shopping experience. We believe finding the right part shouldn't be a hassle.
      </p>
    </div>
  );
}

export default AboutPage;
