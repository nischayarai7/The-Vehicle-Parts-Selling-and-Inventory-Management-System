import React, { useState, useEffect } from 'react';
import './PromoBanner.css';

export default function PromoBanner() {
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 34, seconds: 12 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          // Reset to 4 hours to keep mock timer active
          return { hours: 4, minutes: 0, seconds: 0 };
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatNum = (num) => String(num).padStart(2, '0');

  const offers = [
    {
      id: 1,
      badge: '20% OFF',
      title: 'Brembo Brake Kits',
      desc: 'Premium stopping power for high-performance track & street use.',
      oldPrice: 'Rs. 24,500',
      newPrice: 'Rs. 19,600',
      image: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=250'
    },
    {
      id: 2,
      badge: 'FREE SHIPPING',
      title: 'Mobil 1 Full Synthetic Oil',
      desc: 'Case of 6 quarts. Keep your engine running at peak efficiency.',
      oldPrice: 'Rs. 8,200',
      newPrice: 'Rs. 7,380',
      image: 'https://images.unsplash.com/photo-1635843343990-2e06180a06ec?auto=format&fit=crop&q=80&w=250'
    },
    {
      id: 3,
      badge: 'BUY 3 GET 1 FREE',
      title: 'NGK Iridium Spark Plugs',
      desc: 'Ultimate spark stability and longevity for turbo applications.',
      oldPrice: 'Rs. 1,600 / pc',
      newPrice: 'Rs. 1,200 / pc',
      image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=250'
    }
  ];

  return (
    <section className="promo-section">
      <div className="container">
        
        {/* Flash Sale Header */}
        <div className="promo-banner-main">
          <div className="promo-banner-left">
            <span className="live-tag">
              <span className="live-dot"></span>
              LIMITED TIME FLASH SALE
            </span>
            <h1 className="promo-title">UP TO 30% OFF PREMIUM PARTS</h1>
            <p className="promo-subtitle">
              Upgrade your ride with industry-leading brands. Offer valid on select components only.
            </p>
          </div>
          
          {/* Countdown Clock */}
          <div className="promo-countdown-box">
            <span className="countdown-label">ENDS IN</span>
            <div className="countdown-digits">
              <div className="digit-group">
                <span className="digit-val">{formatNum(timeLeft.hours)}</span>
                <span className="digit-lbl">HRS</span>
              </div>
              <span className="digit-divider">:</span>
              <div className="digit-group">
                <span className="digit-val">{formatNum(timeLeft.minutes)}</span>
                <span className="digit-lbl">MINS</span>
              </div>
              <span className="digit-divider">:</span>
              <div className="digit-group">
                <span className="digit-val">{formatNum(timeLeft.seconds)}</span>
                <span className="digit-lbl">SECS</span>
              </div>
            </div>
          </div>
        </div>

        {/* Promo Offers Grid */}
        <div className="promo-offers-grid">
          {offers.map(offer => (
            <div key={offer.id} className="promo-card" data-promo-click="true">
              <div className="promo-card-body">
                <span className="promo-card-badge-inline">{offer.badge}</span>
                <h3 className="promo-card-title">{offer.title}</h3>
                <p className="promo-card-desc">{offer.desc}</p>
                <div className="promo-card-price-row">
                  <span className="old-price">{offer.oldPrice}</span>
                  <span className="new-price">{offer.newPrice}</span>
                </div>
                <button className="promo-claim-btn">
                  Claim Deal
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
