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
        <div className="vehicle-selector-box">

          {/* ── GUEST: Vehicle Search ── */}
          {!isAuthenticated ? (
            <>
              <div className="selector-header">
                <div className="selector-icon-badge">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-3"/>
                    <circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>
                  </svg>
                </div>
                <div>
                  <h2 className="selector-title">Find Parts For Your Vehicle</h2>
                  <p className="selector-subtitle">Select your make, model &amp; year to get exact-fit parts.</p>
                </div>
              </div>

              {/* Step progress bar */}
              <div className="selector-steps">
                {['Brand', 'Model', 'Year'].map((label, i) => (
                  <div key={label} className={`step-pill ${step > i ? 'done' : step === i ? 'active' : ''}`}>
                    <span className="step-number">{step > i ? '✓' : i + 1}</span>
                    <span className="step-label">{label}</span>
                  </div>
                ))}
              </div>

              <form className="selector-form" onSubmit={handleSearch}>
                {/* Make */}
                <div className="hs-select-wrap">
                  <label className="hs-label">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    Brand / Make
                  </label>
                  <div className="hs-select-inner">
                    <select
                      value={selectedMake}
                      onChange={e => { setSelectedMake(e.target.value); setSelectedModel(''); setSelectedYear(''); }}
                    >
                      <option value="" disabled>— Choose Make —</option>
                      {makes.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <svg className="hs-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>

                {/* Model */}
                <div className="hs-select-wrap">
                  <label className={`hs-label ${!selectedMake ? 'muted' : ''}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                    Vehicle Model
                  </label>
                  <div className="hs-select-inner">
                    <select
                      value={selectedModel}
                      onChange={e => { setSelectedModel(e.target.value); setSelectedYear(''); }}
                      disabled={!selectedMake}
                    >
                      <option value="" disabled>— Choose Model —</option>
                      {models.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <svg className="hs-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>

                {/* Year */}
                <div className="hs-select-wrap">
                  <label className={`hs-label ${!selectedModel ? 'muted' : ''}`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    Year
                  </label>
                  <div className="hs-select-inner">
                    <select
                      value={selectedYear}
                      onChange={e => setSelectedYear(e.target.value)}
                      disabled={!selectedModel}
                    >
                      <option value="" disabled>— Choose Year —</option>
                      {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <svg className="hs-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>

                <button type="submit" className="hs-search-btn" disabled={!selectedYear}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  Search Parts
                </button>
              </form>

              <div className="hs-divider"><span>or</span></div>
              <Link to="/register" className="hs-register-link">
                Create a free account to save your garage
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </Link>
            </>

          /* ── AUTHENTICATED: Add Vehicle Form ── */
          ) : showAddForm ? (
            <div className="add-vehicle-form-container">
              <div className="selector-header">
                <div className="selector-icon-badge">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                </div>
                <div>
                  <h2 className="selector-title">Add Vehicle</h2>
                  <p className="selector-subtitle">Find exact-fit parts for your ride.</p>
                </div>
              </div>

              <form className="selector-form horizontal-grid-form" onSubmit={handleSaveVehicle}>
                {/* Brand */}
                <div className="hs-select-wrap">
                  <label className="hs-label">Brand / Make</label>
                  <div className="hs-select-inner">
                    <select value={addMake} onChange={e => { setAddMake(e.target.value); setAddModel(''); setAddYear(''); }} required>
                      <option value="" disabled>Select Brand</option>
                      {makes.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <svg className="hs-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>

                {/* Model */}
                <div className="hs-select-wrap">
                  <label className={`hs-label ${!addMake ? 'muted' : ''}`}>Vehicle Model</label>
                  <div className="hs-select-inner">
                    <select value={addModel} onChange={e => { setAddModel(e.target.value); setAddYear(''); }} disabled={!addMake} required>
                      <option value="" disabled>Select Model</option>
                      {addModelsList.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <svg className="hs-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>

                {/* Year */}
                <div className="hs-select-wrap">
                  <label className={`hs-label ${!addModel ? 'muted' : ''}`}>Year</label>
                  <div className="hs-select-inner">
                    <select value={addYear} onChange={e => setAddYear(e.target.value)} disabled={!addModel} required>
                      <option value="" disabled>Select Year</option>
                      {addYearsList.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <svg className="hs-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                </div>

                {/* License Plate */}
                <div className="hs-select-wrap">
                  <label className="hs-label">
                    Plate <span className="optional-badge">Optional</span>
                  </label>
                  <div className="hs-input-inner">
                    <input
                      type="text"
                      placeholder="e.g. ABC-1234"
                      value={licensePlate}
                      onChange={e => setLicensePlate(e.target.value)}
                      className="hs-text-input"
                    />
                  </div>
                </div>

                {/* Can't find toggle */}
                <button type="button" className="cant-find-toggle" onClick={() => { setUseCustomVehicle(!useCustomVehicle); setCustomVehicleName(''); }}>
                  {useCustomVehicle ? '← Back to dropdown search' : "Can't find your vehicle? Enter manually"}
                </button>

                {useCustomVehicle && (
                  <div className="hs-select-wrap custom-vehicle-field">
                    <label className="hs-label">Vehicle Name <span style={{color:'#e04f5f', fontSize:'11px', marginLeft:'4px'}}>Required</span></label>
                    <div className="hs-input-inner">
                      <input
                        type="text"
                        placeholder="e.g. Toyota Hilux 2019"
                        value={customVehicleName}
                        onChange={e => setCustomVehicleName(e.target.value)}
                        className="hs-text-input custom-vehicle-input"
                        required={useCustomVehicle}
                      />
                    </div>
                    <span className="custom-vehicle-hint">We'll manually match parts for your vehicle.</span>
                  </div>
                )}

                <div className="premium-form-actions">
                  <button type="button" onClick={() => setShowAddForm(false)} className="btn-premium-cancel">Cancel</button>
                  <button type="submit" className="btn-premium-submit" disabled={useCustomVehicle ? !customVehicleName.trim() : !addYear}>
                    Save Vehicle
                  </button>
                </div>
              </form>
            </div>

          /* ── AUTHENTICATED: Garage View ── */
          ) : (
            <>
              {myVehicles.length > 0 ? (
                <>
                  <div className="selector-header">
                    <div className="selector-icon-badge">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    </div>
                    <div>
                      <h2 className="selector-title">My Garage</h2>
                      <p className="selector-subtitle">{myVehicles.length} vehicle{myVehicles.length > 1 ? 's' : ''} saved</p>
                    </div>
                  </div>

                  <div className="garage-card-list">
                    {myVehicles.slice(0, 2).map((v, i) => (
                      <div key={v.id} className="garage-vehicle-card" style={{animationDelay: `${i * 80}ms`}}>
                        <div className="garage-vehicle-icon">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-3"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
                        </div>
                        <div className="garage-vehicle-info">
                          <strong>{v.displayName}</strong>
                          {v.licensePlate && <span>{v.licensePlate}</span>}
                        </div>
                        <button
                          className="garage-shop-btn"
                          onClick={() => navigate(`/shop?make=${encodeURIComponent(v.make||'')}&model=${encodeURIComponent(v.model||'')}&year=${encodeURIComponent(v.year||'')}`)}
                        >
                          Shop
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                        </button>
                      </div>
                    ))}
                    {myVehicles.length > 2 && (
                      <p className="garage-more-label">+{myVehicles.length - 2} more vehicles</p>
                    )}
                  </div>

                  <div className="garage-actions">
                    <button onClick={() => setShowAddForm(true)} className="hs-search-btn outline">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      Add Vehicle
                    </button>
                    <Link to="/customer/garage" className="hs-manage-link">Manage Garage →</Link>
                  </div>
                </>
              ) : (
                <div className="empty-garage-state">
                  <h3>Your Garage is Empty</h3>
                  <p>Save your vehicles to quickly find compatible premium auto parts.</p>
                  <button onClick={() => setShowAddForm(true)} className="btn-garage-action">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Add Your First Vehicle
                  </button>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </section>
  );
};

export default HeroSection;
