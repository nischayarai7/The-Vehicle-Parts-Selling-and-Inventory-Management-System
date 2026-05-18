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
  
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  // Garage quick add form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [addMake, setAddMake] = useState('');
  const [addModel, setAddModel] = useState('');
  const [addYear, setAddYear] = useState('');
  const [licensePlate, setLicensePlate] = useState('');

  useEffect(() => {
    fetchVehicles();
    if (isAuthenticated) {
      fetchMyVehicles();
    }
  }, [isAuthenticated]);

  const fetchVehicles = async () => {
    try {
      const data = await api.getVehicles();
      setVehicles(data);
    } catch (err) {
      console.error('Error fetching vehicles:', err);
    }
  };

  const fetchMyVehicles = async () => {
    try {
      const data = await api.getMyVehicles();
      setMyVehicles(data);
    } catch (err) {
      console.error('Error fetching my vehicles:', err);
    }
  };

  const makes = [...new Set(vehicles.map(v => v.make))];
  const models = [...new Set(vehicles.filter(v => v.make === selectedMake).map(v => v.model))];
  const years = [...new Set(vehicles.filter(v => v.make === selectedMake && v.model === selectedModel).map(v => v.year))];

  const handleSearch = (e) => {
    e.preventDefault();
    if (selectedMake && selectedModel && selectedYear) {
      navigate(`/shop?make=${encodeURIComponent(selectedMake)}&model=${encodeURIComponent(selectedModel)}&year=${encodeURIComponent(selectedYear)}`);
    }
  };

  const addModelsList = [...new Set(vehicles.filter(v => v.make === addMake).map(v => v.model))].sort();
  const addYearsList = [...new Set(vehicles.filter(v => v.make === addMake && v.model === addModel).map(v => v.year))].sort((a, b) => b - a);

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
        await api.addMyVehicle({
          vehicleId: matched.id,
          licensePlate: licensePlate || '',
          vin: '',
          color: ''
        });
        
        if (showToast) {
          showToast('Vehicle successfully added to your Garage!', 'success');
        }
        
        fetchMyVehicles();
        setShowAddForm(false);
        setAddMake('');
        setAddModel('');
        setAddYear('');
        setLicensePlate('');
      } else {
        if (showToast) {
          showToast('Selected vehicle model configuration is not available.', 'error');
        }
      }
    } catch (err) {
      console.error('Error adding vehicle to garage:', err);
      if (showToast) {
        showToast(err.message || 'Failed to save vehicle.', 'error');
      }
    }
  };

  return (
    <section className="hero-section">
      <div className="container hero-container">
        <div className="vehicle-selector-box">
          
          {!isAuthenticated ? (
            <>
              <h2 className="selector-title">Find Parts For Your Vehicle</h2>
              <form className="selector-form" onSubmit={handleSearch}>
                <div className="select-group">
                  <select value={selectedMake} onChange={e => { setSelectedMake(e.target.value); setSelectedModel(''); setSelectedYear(''); }}>
                    <option value="" disabled>Choose Brand</option>
                    {makes.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="select-group">
                  <select value={selectedModel} onChange={e => { setSelectedModel(e.target.value); setSelectedYear(''); }} disabled={!selectedMake}>
                    <option value="" disabled>Choose Model</option>
                    {models.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="select-group">
                  <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} disabled={!selectedModel}>
                    <option value="" disabled>Choose Year</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <button type="submit" className="btn-primary select-btn" disabled={!selectedYear}>Search Parts</button>
              </form>
              <div className="hero-register-prompt" style={{ marginTop: '25px', textAlign: 'center', color: '#fff' }}>
                <p style={{ marginBottom: '10px', fontSize: '0.9rem', opacity: 0.9 }}>Save your vehicles for quicker checkout.</p>
                <Link to="/register" className="btn-secondary" style={{ display: 'inline-block', width: '100%', textAlign: 'center' }}>Register Now</Link>
              </div>
            </>
          ) : showAddForm ? (
            <>
              <h2 className="selector-title">Add Vehicle</h2>
              <form className="selector-form" onSubmit={handleSaveVehicle}>
                <div className="select-group">
                  <select value={addMake} onChange={e => { setAddMake(e.target.value); setAddModel(''); setAddYear(''); }} required>
                    <option value="" disabled>Choose Brand</option>
                    {makes.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="select-group">
                  <select value={addModel} onChange={e => { setAddModel(e.target.value); setAddYear(''); }} disabled={!addMake} required>
                    <option value="" disabled>Choose Model</option>
                    {addModelsList.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="select-group">
                  <select value={addYear} onChange={e => setAddYear(e.target.value)} disabled={!addModel} required>
                    <option value="" disabled>Choose Year</option>
                    {addYearsList.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="select-group">
                  <input 
                    type="text" 
                    placeholder="License Plate (Optional)" 
                    value={licensePlate} 
                    onChange={e => setLicensePlate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '15px',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '15px',
                      color: 'var(--text-main)',
                      backgroundColor: 'white'
                    }}
                  />
                </div>
                <button type="submit" className="btn-garage-dark" disabled={!addYear}>
                  Save to Garage
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowAddForm(false)} 
                  className="btn-garage-outline"
                >
                  Cancel
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="selector-title">My Garage</h2>
              {myVehicles.length > 0 ? (
                <div className="my-garage-list">
                  {myVehicles.slice(0, 2).map(v => (
                    <div key={v.id} className="garage-item" style={{ background: '#fff', padding: '15px', marginBottom: '10px', borderRadius: '4px', color: '#333' }}>
                      <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.1rem' }}>{v.displayName}</p>
                      {v.licensePlate && <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: '#666' }}>Plate: {v.licensePlate}</p>}
                      <button 
                        onClick={() => navigate(`/shop?make=${encodeURIComponent(v.make || '')}&model=${encodeURIComponent(v.model || '')}&year=${encodeURIComponent(v.year || '')}`)} 
                        className="btn-primary" 
                        style={{ width: '100%', marginTop: '15px', padding: '10px' }}
                      >
                        Shop for this vehicle
                      </button>
                    </div>
                  ))}
                  {myVehicles.length > 2 && <p style={{color: 'white', textAlign: 'center'}}>+ {myVehicles.length - 2} more vehicles</p>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                    <button 
                      onClick={() => setShowAddForm(true)} 
                      className="btn-garage-dark"
                    >
                      Add Another Vehicle
                    </button>
                    <Link to="/settings" className="btn-secondary" style={{ display: 'block', textAlign: 'center' }}>Manage Garage</Link>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: '#fff' }}>
                  <p style={{ marginBottom: '20px' }}>You haven't added any vehicles yet.</p>
                  <button 
                    onClick={() => setShowAddForm(true)} 
                    className="btn-garage-dark"
                  >
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
