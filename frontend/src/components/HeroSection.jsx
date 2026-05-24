import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import './HeroSection.css';

const HeroSection = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const { showToast } = useCart();
  const [vehicles, setVehicles] = useState([]);
  const [myVehicles, setMyVehicles] = useState([]);
  const [wallpaperUrl, setWallpaperUrl] = useState(null);
  const [promoParts, setPromoParts] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  const [showAddForm, setShowAddForm] = useState(false);
  const [addMake, setAddMake] = useState('');
  const [addModel, setAddModel] = useState('');
  const [addYear, setAddYear] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [customVehicleName, setCustomVehicleName] = useState('');
  const [useCustomVehicle, setUseCustomVehicle] = useState(false);

  useEffect(() => {
    fetchVehicles();
    fetchWallpaper();
    fetchPromoParts();
    if (isAuthenticated) fetchMyVehicles();
  }, [isAuthenticated]);

  const fetchWallpaper = async () => {
    try {
      const data = await api.getWallpaper();
      if (data?.url) setWallpaperUrl(data.url);
    } catch (err) { console.error(err); }
  };

  const fetchVehicles = async () => {
    try {
      const data = await api.getVehicles();
      setVehicles(data);
    } catch (err) { console.error(err); }
  };

  const fetchMyVehicles = async () => {
    try {
      const data = await api.getMyVehicles();
      setMyVehicles(data);
    } catch (err) { console.error(err); }
  };

  const fetchPromoParts = async () => {
    try {
      const allParts = await api.getAllParts();
      const available = allParts.filter(p => p.stockQuantity > 0).slice(0, 4);
      setPromoParts(available);
    } catch (err) {
      console.error("Failed to fetch promo parts:", err);
    }
  };

  useEffect(() => {
    if (promoParts.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % promoParts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [promoParts]);

  const makes  = [...new Set(vehicles.map(v => v.make))].sort();
  const models = [...new Set(vehicles.filter(v => v.make === selectedMake).map(v => v.model))].sort();
  const years  = [...new Set(vehicles.filter(v => v.make === selectedMake && v.model === selectedModel).map(v => v.year))].sort((a, b) => b - a);

  const addModelsList = [...new Set(vehicles.filter(v => v.make === addMake).map(v => v.model))].sort();
  const addYearsList  = [...new Set(vehicles.filter(v => v.make === addMake && v.model === addModel).map(v => v.year))].sort((a, b) => b - a);

  const handleSearch = (e) => {
    e.preventDefault();
    if (selectedMake && selectedModel && selectedYear) {
      navigate(`/shop?make=${encodeURIComponent(selectedMake)}&model=${encodeURIComponent(selectedModel)}&year=${encodeURIComponent(selectedYear)}`);
    }
  };

  const handleSaveVehicle = async (e) => {
    e.preventDefault();
    if (!addMake || !addModel || !addYear) return;
    try {
      const matched = vehicles.find(v =>
        v.make.toLowerCase() === addMake.toLowerCase() &&
        v.model.toLowerCase() === addModel.toLowerCase() &&
        v.year.toString() === addYear.toString()
      );
      if (matched) {
        await api.addMyVehicle({ vehicleId: matched.id, licensePlate: licensePlate || '', vin: '', color: '' });
        showToast?.('Vehicle added to your Garage!', 'success');
        fetchMyVehicles();
        setShowAddForm(false);
        setAddMake(''); setAddModel(''); setAddYear(''); setLicensePlate(''); setCustomVehicleName(''); setUseCustomVehicle(false);
      } else {
        showToast?.('Selected vehicle configuration is not available.', 'error');
      }
    } catch (err) {
      showToast?.(err.message || 'Failed to save vehicle.', 'error');
    }
  };

  // Step progress for guest form
  const step = selectedMake ? (selectedModel ? (selectedYear ? 3 : 2) : 1) : 0;

  return (
    <section className="hero-section" style={wallpaperUrl ? { backgroundImage: `url(${wallpaperUrl})` } : {}}>
      <div className="container hero-container">


        {promoParts.length > 0 && (
          <div className="hero-promo-carousel">
            <div className="promo-header">
              <span className="promo-badge-glow">⚡ FLASH SALE</span>
              <h3 className="promo-title">TOP PICKS FOR YOU</h3>
            </div>
            <div className="promo-card-slider">
              {promoParts.map((part, idx) => {
                const isCurrent = idx === currentIndex;
                // Dynamic discount tier based on part.id — 4 tiers: 10%, 15%, 20%, 25%
                const discountPercent = [10, 15, 20, 25][part.id % 4];
                // Back-calculate the "original" price so part.price IS the sale price
                const originalPrice = Math.ceil(part.price / (1 - discountPercent / 100) / 10) * 10;
                const savings = originalPrice - part.price;
                const offerLabels = ['HOT DEAL', 'BEST PRICE', 'TOP PICK', 'MUST HAVE'];
                const offerLabel = offerLabels[part.id % 4];
                return (
                  <div
                    key={part.id}
                    className={`promo-slide-card ${isCurrent ? 'active' : ''}`}
                  >
                    {/* Image with flash sale overlay sticker */}
                    <div className="promo-image-container">
                      <img
                        src={part.imageUrl}
                        alt={part.name}
                        onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${part.name}&background=fff&color=e33b3b` }}
                      />
                      {/* Discount ribbon sticker */}
                      <div className="promo-sticker-ribbon">
                        <span className="promo-sticker-pct">{discountPercent}%</span>
                        <span className="promo-sticker-off">OFF</span>
                      </div>
                      {/* Offer label top-left */}
                      <div className="promo-offer-tag">{offerLabel}</div>
                    </div>

                    <div className="promo-info">
                      <span className="promo-part-brand">{part.brand || '6IX7EVEN Premium'}</span>
                      <h4 className="promo-part-name">{part.name}</h4>

                      {/* Savings banner */}
                      <div className="promo-savings-banner">
                        <span>⚡</span>
                        <span>You save <strong>Rs. {savings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong> on this deal!</span>
                      </div>

                      <div className="promo-pricing">
                        <span className="original-price-strike">Rs. {originalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        <span className="promo-discounted-price">Rs. {part.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        <span className="promo-discount-badge">{discountPercent}% off</span>
                      </div>

                      <div className="promo-actions">
                        <button
                          className="btn-promo-quick-buy"
                          onClick={() => navigate(`/shop/part/${part.id}`)}
                        >
                          ⚡ Buy Now
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="promo-dots">
              {promoParts.map((_, idx) => (
                <button
                  key={idx}
                  className={`promo-dot ${idx === currentIndex ? 'active' : ''}`}
                  onClick={() => setCurrentIndex(idx)}
                />
              ))}
            </div>
          </div>
        )}

      </div>
    </section>
  );
};

export default HeroSection;
