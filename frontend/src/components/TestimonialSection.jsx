import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

const TestimonialSection = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const data = await api.getServiceReviews();
        // Filter out reviews without comments, sort by highest rating first, then newest
        const validReviews = data
          .filter(r => r.comment && r.comment.trim() !== '')
          .sort((a, b) => {
            if (b.rating !== a.rating) return b.rating - a.rating;
            return new Date(b.createdAt) - new Date(a.createdAt);
          })
          .slice(0, 8); // Take top 8 reviews for display
        
        setReviews(validReviews);
      } catch (err) {
        console.error('Failed to load testimonials:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  if (loading || reviews.length === 0) return null;

  return (
    <section style={{
      padding: '80px 20px',
      background: 'linear-gradient(to bottom, #0d1117, #161b22)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background ambient glows */}
      <div style={{
        position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '60%',
        background: 'radial-gradient(circle, rgba(227, 179, 65, 0.05) 0%, rgba(13, 17, 23, 0) 70%)',
        zIndex: 0, filter: 'blur(60px)'
      }} />
      <div style={{
        position: 'absolute', bottom: '-10%', right: '-10%', width: '40%', height: '60%',
        background: 'radial-gradient(circle, rgba(248, 81, 73, 0.05) 0%, rgba(13, 17, 23, 0) 70%)',
        zIndex: 0, filter: 'blur(60px)'
      }} />

      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '800', margin: '0 0 16px 0', color: '#fff', letterSpacing: '-0.5px' }}>
            What Our Customers Say
          </h2>
          <p style={{ color: '#8b949e', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
            Don't just take our word for it. Read real experiences from the 6ix7even community.
          </p>
        </div>

        {/* Floating Reviews Container */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          alignItems: 'start'
        }}>
          {reviews.map((review, index) => {
            // Calculate a staggered delay and slight random Y offset for floating effect
            const delay = index * 0.2;
            const floatDuration = 6 + (index % 3);
            
            return (
              <div 
                key={review.id}
                className="floating-review-card"
                style={{
                  animation: `float ${floatDuration}s ease-in-out infinite`,
                  animationDelay: `${delay}s`,
                  background: 'rgba(22, 27, 34, 0.7)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '16px',
                  padding: '28px',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
                  position: 'relative'
                }}
              >
                {/* Decorative Quote Icon */}
                <div style={{ position: 'absolute', top: '24px', right: '24px', opacity: 0.1, color: '#e3b341' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                  </svg>
                </div>

                {/* Stars */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <svg key={star} width="18" height="18" viewBox="0 0 24 24" fill={star <= review.rating ? '#e3b341' : 'none'} stroke={star <= review.rating ? '#e3b341' : '#4a4a4a'} strokeWidth="1.5">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </div>

                {/* Comment */}
                <p style={{ 
                  color: '#c9d1d9', fontSize: '15px', lineHeight: '1.6', 
                  marginBottom: '24px', position: 'relative', zIndex: 1,
                  display: '-webkit-box', WebkitLineClamp: '4', WebkitBoxOrient: 'vertical', overflow: 'hidden'
                }}>
                  "{review.comment}"
                </p>

                {/* User Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: 'auto' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: `hsl(${((review.customer?.fullName || 'A').charCodeAt(0) * 47) % 360}, 50%, 25%)`,
                    border: '2px solid rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px', fontWeight: '700', color: '#fff'
                  }}>
                    {(review.customer?.fullName || 'A')[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', color: '#fff', fontSize: '14px' }}>
                      {review.customer?.fullName || 'Anonymous User'}
                    </div>
                    <div style={{ color: '#8b949e', fontSize: '12px' }}>
                      Verified Customer
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <style>
        {`
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
          }
          .floating-review-card:hover {
            transform: translateY(-12px) scale(1.02) !important;
            border-color: rgba(227, 179, 65, 0.3) !important;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(227, 179, 65, 0.1) !important;
            animation-play-state: paused !important;
          }
        `}
      </style>
    </section>
  );
};

export default TestimonialSection;
