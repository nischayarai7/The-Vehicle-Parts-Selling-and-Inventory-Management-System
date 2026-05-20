import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './AboutPage.css';

function AboutPage() {
  const [activeTab, setActiveTab] = useState('story');

  return (
    <div className="about-page-wrapper container">
      {/* Hero Header Section */}
      <header className="about-hero" style={{ borderRadius: '16px', overflow: 'hidden', marginTop: '20px' }}>
        <div className="about-hero-content" style={{ width: '100%' }}>
          <h1 className="about-title">About 6IX7EVEN Auto Parts</h1>
          <p className="about-subtitle">
            Driving Innovation, Engineering Perfection. Your ultimate destination for elite automotive performance engineering and premium vehicle parts.
          </p>
        </div>
      </header>

      {/* Stats Section */}
      <section className="about-stats-container">
        <div className="about-stats-grid">
          <div className="about-stat-card">
            <div className="stat-icon-wrap">
              {/* Lucide Box Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
            </div>
            <div className="stat-number">15,000+</div>
            <div className="stat-label">Cataloged Parts</div>
            <p className="stat-desc">A comprehensive database of premium vehicle components engineered to fit your specific build.</p>
          </div>

          <div className="about-stat-card">
            <div className="stat-icon-wrap">
              {/* Lucide Check Circle Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <div className="stat-number">99.8%</div>
            <div className="stat-label">Fitment Accuracy</div>
            <p className="stat-desc">Our intelligent smart-garage matching database guarantees you receive exact-fit parts every time.</p>
          </div>

          <div className="about-stat-card">
            <div className="stat-icon-wrap">
              {/* Lucide Headset Icon */}
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
              </svg>
            </div>
            <div className="stat-number">24/7</div>
            <div className="stat-label">Expert Support</div>
            <p className="stat-desc">Our team of experienced automotive engineers is always on hand to help verify part compatibility.</p>
          </div>
        </div>
      </section>

      {/* Interactive Tabs Section */}
      <section className="about-interactive-section">
        <div className="about-tabs-header">
          <button 
            className={`about-tab-btn ${activeTab === 'story' ? 'active' : ''}`}
            onClick={() => setActiveTab('story')}
          >
            Our Story
          </button>
          <button 
            className={`about-tab-btn ${activeTab === 'values' ? 'active' : ''}`}
            onClick={() => setActiveTab('values')}
          >
            Core Values
          </button>
          <button 
            className={`about-tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            Milestones
          </button>
          <button 
            className={`about-tab-btn ${activeTab === 'engineering' ? 'active' : ''}`}
            onClick={() => setActiveTab('engineering')}
          >
            Engineering Standard
          </button>
        </div>

        {/* Tab Panels */}
        <div className="about-tab-panel">
          {activeTab === 'story' && (
            <div className="tab-grid-content">
              <div className="tab-text-side">
                <h3>Designed by Enthusiasts, for Enthusiasts</h3>
                <p>
                  Founded in 2024, 6IX7EVEN Auto Parts emerged from a simple realization: finding verified, compatibility-guaranteed auto parts online was far too complicated. What began as a local parts finder has grown into a leading database-driven inventory and checkout platform.
                </p>
                <p>
                  Today, we bridge the gap between premium vendors and car enthusiasts. We provide access to certified original equipment manufacturer (OEM) parts, custom styling upgrades, and reliable maintenance replacements under a single digital hub.
                </p>
                <ul className="tab-feature-bullets">
                  <li>
                    {/* Lucide Check Icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Direct manufacturer partnership ensures competitive pricing.
                  </li>
                  <li>
                    {/* Lucide Check Icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    Fully integrated smart checkout with custom garage filters.
                  </li>
                </ul>
              </div>
              <div className="tab-image-side">
                <img 
                  src="https://images.unsplash.com/photo-1552820728-8b83bb6b773f?q=80&w=600&auto=format&fit=crop" 
                  alt="Our Story" 
                  className="tab-panel-image"
                />
              </div>
            </div>
          )}

          {activeTab === 'values' && (
            <div className="value-cards-grid">
              <div className="value-card-item">
                <div className="value-card-icon">
                  {/* Lucide Settings Icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </div>
                <div className="value-card-text">
                  <h4>Reliability First</h4>
                  <p>We perform rigorous checks on every part number and batch to guarantee they match manufacturer specifications perfectly.</p>
                </div>
              </div>

              <div className="value-card-item">
                <div className="value-card-icon">
                  {/* Lucide Layers Icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                    <polyline points="2 17 12 22 22 17"></polyline>
                    <polyline points="2 12 12 17 22 12"></polyline>
                  </svg>
                </div>
                <div className="value-card-text">
                  <h4>Unparalleled Inventory</h4>
                  <p>From custom forced induction turbos to simple cabin filters, our catalog holds absolute range diversity.</p>
                </div>
              </div>

              <div className="value-card-item">
                <div className="value-card-icon">
                  {/* Lucide Shield Check Icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    <polyline points="9 12 11 14 15 10"></polyline>
                  </svg>
                </div>
                <div className="value-card-text">
                  <h4>Secure &amp; Safe</h4>
                  <p>Security and client safety guide our platforms. Rest easy knowing your transaction details are fully encrypted.</p>
                </div>
              </div>

              <div className="value-card-item">
                <div className="value-card-icon">
                  {/* Lucide Heart Icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                </div>
                <div className="value-card-text">
                  <h4>Loyalty Driven</h4>
                  <p>We build lasting relations. Check out our automatic 10% loyalty discounts applied for bulk purchases.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="timeline-flow">
              <div className="timeline-node">
                <div className="timeline-year-circle">24'</div>
                <div className="timeline-body">
                  <h4>Platform Inception</h4>
                  <p>Launched the initial beta of 6IX7EVEN catalog engine, featuring database indexing for major Japanese and German automotive makers.</p>
                </div>
              </div>

              <div className="timeline-node">
                <div className="timeline-year-circle">25'</div>
                <div className="timeline-body">
                  <h4>Smart Garage Rollout</h4>
                  <p>Introduced the smart compatibility engine, enabling users to add vehicles directly to their profile for exact-fit recommendations.</p>
                </div>
              </div>

              <div className="timeline-node">
                <div className="timeline-year-circle">26'</div>
                <div className="timeline-body">
                  <h4>Real-time Review System &amp; Expansion</h4>
                  <p>Upgraded to a fully database-driven review module with automatic 30-day throttle safety protocols to keep consumer reviews authentic.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'engineering' && (
            <div className="tab-grid-content">
              <div className="tab-text-side">
                <h3>Verifying Every Millimeter</h3>
                <p>
                  Compatibility is our obsession. We implement database-backed foreign relationships matching part numbers directly with unique vehicle models, model years, and specific trim/engine profiles.
                </p>
                <p>
                  No more order errors, no more return shipping hassles. Before a part enters our storefront listing catalog, it is reviewed and cataloged by certified auto mechanics.
                </p>
              </div>
              <div className="tab-image-side">
                <img 
                  src="https://images.unsplash.com/photo-1616788494707-ec28f08d05a1?q=80&w=600&auto=format&fit=crop" 
                  alt="Engineering Standard" 
                  className="tab-panel-image"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="about-cta-container">
        <div className="about-cta-banner">
          <h3>Ready to Optimize Your Ride?</h3>
          <p>Explore our premium catalog of verified parts or add a vehicle to your garage to filter exact fits instantly.</p>
          <Link to="/shop" className="about-cta-btn">
            Browse Auto Shop
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '4px' }}>
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}

export default AboutPage;
