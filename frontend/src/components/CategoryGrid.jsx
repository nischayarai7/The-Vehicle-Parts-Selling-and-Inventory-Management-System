import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import './CategoryGrid.css';

const AUTOPLAY_INTERVAL = 4000;

// How many cards visible per breakpoint
const getVisibleCount = () => {
  if (window.innerWidth >= 1200) return 5;
  if (window.innerWidth >= 992)  return 4;
  if (window.innerWidth >= 768)  return 3;
  if (window.innerWidth >= 480)  return 2;
  return 1;
};

const CategoryGrid = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);           // active slide index
  const [visibleCount, setVisibleCount] = useState(getVisibleCount());
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [dragDelta, setDragDelta] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);
  const [isPaused, setIsPaused] = useState(false);

  const trackRef = useRef(null);
  const autoplayRef = useRef(null);
  const navigate = useNavigate();

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    api.getActiveCategories()
      .then(data => setCategories(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // ── Responsive resize ──────────────────────────────────────────────────────
  useEffect(() => {
    const handleResize = () => setVisibleCount(getVisibleCount());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const maxIndex = Math.max(0, categories.length - visibleCount);

  const goTo = useCallback((newIdx) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setIndex(Math.max(0, Math.min(newIdx, maxIndex)));
    setTimeout(() => setIsAnimating(false), 400);
  }, [isAnimating, maxIndex]);

  const prev = useCallback(() => goTo(index - 1), [goTo, index]);
  const next = useCallback(() => goTo(index + 1), [goTo, index]);

  // ── Autoplay ───────────────────────────────────────────────────────────────
  const resetAutoplay = useCallback(() => {
    clearInterval(autoplayRef.current);
    if (!isPaused) {
      autoplayRef.current = setInterval(() => {
        setIndex(prev => {
          const next = prev + 1;
          return next > maxIndex ? 0 : next;
        });
      }, AUTOPLAY_INTERVAL);
    }
  }, [isPaused, maxIndex]);

  useEffect(() => {
    if (categories.length > visibleCount) resetAutoplay();
    return () => clearInterval(autoplayRef.current);
  }, [categories, visibleCount, isPaused, resetAutoplay]);

  // ── Drag / Swipe ───────────────────────────────────────────────────────────
  const [hasDragged, setHasDragged] = useState(false);

  const onDragStart = (e) => {
    clearInterval(autoplayRef.current);
    setIsDragging(true);
    setDragStart(e.touches ? e.touches[0].clientX : e.clientX);
    setDragDelta(0);
    setHasDragged(false);
  };

  const onDragMove = (e) => {
    if (!isDragging) return;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const delta = x - dragStart;
    setDragDelta(delta);
    if (Math.abs(delta) > 5) {
      setHasDragged(true);
    }
  };

  const onDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (Math.abs(dragDelta) > 60) {
      dragDelta < 0 ? next() : prev();
    }
    setDragDelta(0);
    resetAutoplay();
  };

  // ── Card width calculation ─────────────────────────────────────────────────
  const cardGap = 20;
  const trackWidth = trackRef.current?.clientWidth || 0;
  const cardWidth = trackWidth > 0
    ? (trackWidth - (visibleCount - 1) * cardGap) / visibleCount
    : 220;

  const translateX = -(index * (cardWidth + cardGap)) + dragDelta;

  if (loading) {
    return (
      <section className="category-section">
        <div className="container">
          <div className="category-section-header">
            <div className="section-header-left">
              <span className="section-eyebrow">Browse Our Inventory</span>
              <h2 className="section-title-modern">Shop by <span className="accent-text">Category</span></h2>
            </div>
          </div>
          <div className="category-skeleton-track">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="category-skeleton-card">
                <div className="skeleton-img"></div>
                <div className="skeleton-text"></div>
                <div className="skeleton-text short"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return (
      <section className="category-section">
        <div className="container">
          <p className="category-empty">No categories available yet.</p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="category-section"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="container">

        {/* ── Header ── */}
        <div className="category-section-header">
          <div className="section-header-left">
            <span className="section-eyebrow">Browse Our Inventory</span>
            <h2 className="section-title-modern">
              Shop by <span className="accent-text">Category</span>
            </h2>
            <p className="section-subtitle">
              Find exactly what your vehicle needs, from engine components to exterior accessories.
            </p>
          </div>

          {/* Removed View All button per user request */}
        </div>

        {/* ── Slider Track ── */}
        <div className="slider-viewport">
          <div
            ref={trackRef}
            className="slider-track"
            style={{
              transform: `translateX(${translateX}px)`,
              transition: isDragging ? 'none' : 'transform 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              gap: `${cardGap}px`,
              cursor: isDragging ? 'grabbing' : 'grab',
            }}
            onMouseDown={onDragStart}
            onMouseMove={onDragMove}
            onMouseUp={onDragEnd}
            onMouseLeave={onDragEnd}
            onTouchStart={onDragStart}
            onTouchMove={onDragMove}
            onTouchEnd={onDragEnd}
          >
            {categories.map((category) => (
              <div
                key={category.id}
                className="category-slide-card"
                style={{ minWidth: `${cardWidth}px`, width: `${cardWidth}px` }}
                onMouseEnter={() => setHoveredId(category.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Image */}
                <div className="slide-img-wrap">
                  <img
                    src={category.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(category.name)}&background=f1f1f1&color=e33b3b&size=300`}
                    alt={category.name}
                    draggable={false}
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(category.name)}&background=f1f1f1&color=e33b3b&size=300`;
                    }}
                  />
                  <div className="slide-img-overlay"></div>
                  {/* Hover badge */}
                  <button 
                    className="slide-shop-badge"
                    style={{ border: 'none', outline: 'none' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!hasDragged) {
                        navigate(`/shop?category=${category.id}`);
                      }
                    }}
                  >
                    Shop Now
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </button>
                </div>

                {/* Info */}
                <div className="slide-info">
                  <h3 className="slide-name">{category.name}</h3>
                  <p className="slide-desc">{category.description || 'Explore premium parts'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Dot Indicators ── */}
        {categories.length > visibleCount && (
          <div className="slider-dots">
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                className={`slider-dot ${i === index ? 'active' : ''}`}
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* ── Autoplay progress bar ── */}
        {!isPaused && categories.length > visibleCount && (
          <div className="slider-progress-bar" key={index}>
            <div className="slider-progress-fill" style={{ animationDuration: `${AUTOPLAY_INTERVAL}ms` }} />
          </div>
        )}

      </div>
    </section>
  );
};

export default CategoryGrid;
