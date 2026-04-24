import React from 'react';
import './HeroSection.css';

const HeroSection = () => {
  return (
    <section className="hero-section">
      <div className="container hero-container">
        <div className="vehicle-selector-box">
          <h2 className="selector-title">Select Your Vehicle</h2>
          <form className="selector-form" onSubmit={(e) => e.preventDefault()}>
            <div className="select-group">
              <select defaultValue="">
                <option value="" disabled>Choose Brand</option>
                <option value="toyota">Toyota</option>
                <option value="honda">Honda</option>
                <option value="ford">Ford</option>
              </select>
            </div>
            <div className="select-group">
              <select defaultValue="">
                <option value="" disabled>Choose Model</option>
                <option value="camry">Camry</option>
                <option value="civic">Civic</option>
                <option value="mustang">Mustang</option>
              </select>
            </div>
            <div className="select-group">
              <select defaultValue="">
                <option value="" disabled>Choose Accessories</option>
                <option value="brakes">Brakes</option>
                <option value="engine">Engine Parts</option>
                <option value="interior">Interior</option>
              </select>
            </div>
            <button type="submit" className="btn-primary select-btn">Select</button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
