import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import ConfirmModal from '../../components/common/ConfirmModal';
import './CustomerDashboard.css'; // Reuse dashboard variables and structure

const CustomerGaragePage = () => {
  const [myVehicles, setMyVehicles] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [newVehicle, setNewVehicle] = useState({ vehicleId: '', licensePlate: '', vin: '', color: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, idToRemove: null });

  // Custom parsed vehicle state
  const [customParsed, setCustomParsed] = useState(null);

  // Searchable dropdown states
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchGarageData();
  }, []);

  // Click outside close for the searchable dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchGarageData = async () => {
    try {
      setLoading(true);
      const [myRes, availableRes] = await Promise.all([
        api.getMyVehicles().catch(() => []),
        api.getVehicles().catch(() => [])
      ]);
      setMyVehicles(myRes || []);
      setAvailableVehicles(availableRes || []);
    } catch (err) {
      console.error('Failed to load garage data:', err);
      showMessage('error', 'Could not refresh garage inventory.');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // Automatically parses text into Year, Make, Model
  const parseVehicleInput = (str) => {
    if (!str.trim()) return null;
    
    // Find year matching a 4-digit number between 1900 and current year + 2
    const yearRegex = /\b(19\d\d|20\d\d)\b/;
    const match = str.match(yearRegex);
    const year = match ? parseInt(match[0]) : new Date().getFullYear();
    
    // Remove the year digits from text to parse Make and Model
    const cleanedStr = str.replace(yearRegex, '').trim();
    const parts = cleanedStr.split(/\s+/).filter(Boolean);
    
    let make = 'Custom';
    let model = 'Vehicle';
    
    if (parts.length > 0) {
      // First word is Brand/Make
      make = parts[0];
      make = make.charAt(0).toUpperCase() + make.slice(1);
    }
    
    if (parts.length > 1) {
      // Remaining words are Model name
      model = parts.slice(1).join(' ');
    } else if (parts.length === 1) {
      model = parts[0];
    }
    
    return { make, model, year };
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    
    let targetVehicleId = null;

    if (customParsed) {
      try {
        setSubmitting(true);
        
        // 1. Check if the parsed model already exists in the catalog
        const existing = availableVehicles.find(
          v => v.make.toLowerCase() === customParsed.make.toLowerCase() &&
               v.model.toLowerCase() === customParsed.model.toLowerCase() &&
               v.year === customParsed.year
        );

        if (existing) {
          targetVehicleId = existing.id;
        } else {
          // 2. Add it to the system's global vehicles catalog
          const registered = await api.addVehicle({
            make: customParsed.make,
            model: customParsed.model,
            year: customParsed.year,
            trim: '',
            engineType: ''
          });
          
          targetVehicleId = registered.id || (registered.data ? registered.data.id : null);
          if (!targetVehicleId) {
            throw new Error('Failed to retrieve registered custom model ID.');
          }
        }
      } catch (err) {
        console.error('Failed to register custom model:', err);
        showMessage('error', err.message || 'Failed to register custom vehicle specs.');
        setSubmitting(false);
        return;
      }
    } else {
      if (!newVehicle.vehicleId) {
        showMessage('error', 'Please search and select a vehicle model.');
        return;
      }
      targetVehicleId = parseInt(newVehicle.vehicleId);
    }

    try {
      setSubmitting(true);
      await api.addMyVehicle({
        vehicleId: targetVehicleId,
        licensePlate: newVehicle.licensePlate,
        vin: newVehicle.vin,
        color: newVehicle.color
      });
      
      showMessage('success', 'Vehicle successfully added to your garage.');
      
      // Reset state
      setNewVehicle({ vehicleId: '', licensePlate: '', vin: '', color: '' });
      setCustomParsed(null);
      setSearchQuery('');
      setShowAddForm(false);
      
      await fetchGarageData();
    } catch (err) {
      console.error(err);
      showMessage('error', err.message || 'Failed to add vehicle to your garage.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVehicle = (id) => {
    setConfirmModal({ isOpen: true, idToRemove: id });
  };

  const executeDeleteVehicle = async () => {
    const id = confirmModal.idToRemove;
    setConfirmModal({ isOpen: false, idToRemove: null });
    if (!id) return;

    try {
      setLoading(true);
      await api.deleteMyVehicle(id);
      showMessage('success', 'Vehicle removed from your garage.');
      const myRes = await api.getMyVehicles().catch(() => []);
      setMyVehicles(myRes || []);
    } catch (err) {
      console.error(err);
      showMessage('error', 'Failed to remove vehicle.');
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = availableVehicles.filter(v => {
    const text = (v.displayName || `${v.make} ${v.model} (${v.year})`).toLowerCase();
    return text.includes(searchQuery.toLowerCase());
  });

  if (loading && myVehicles.length === 0) {
    return (
      <div className="spinner-wrapper">
        <div className="loading-spinner"></div>
        <p style={{ marginTop: '16px' }}>Loading your garage...</p>
      </div>
    );
  }

  return (
    <div className="staff-dashboard-container">
      {/* Page Header */}
      <div className="welcome-banner" style={{ minHeight: 'auto', padding: '24px' }}>
        <div className="welcome-text">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg style={{ width: '28px', height: '28px', color: '#1890ff' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
              <circle cx="7" cy="17" r="2"/>
              <circle cx="15" cy="17" r="2"/>
            </svg>
            My Virtual Garage
          </h2>
          <p>Manage the vehicles you own to easily check compatibility and book service appointments.</p>
        </div>
        {!showAddForm && (
          <button 
            onClick={() => {
              setShowAddForm(true);
              setSearchQuery('');
              setCustomParsed(null);
            }} 
            className="btn-table-action"
            style={{ 
              padding: '10px 20px', 
              background: '#1890ff', 
              border: '1px solid #1890ff', 
              fontSize: '13px', 
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Vehicle
          </button>
        )}
      </div>

      {message.text && (
        <div style={{
          padding: '12px',
          borderRadius: '8px',
          background: message.type === 'success' ? 'rgba(46, 160, 67, 0.15)' : 'rgba(248, 81, 73, 0.15)',
          color: message.type === 'success' ? '#3fb950' : '#f85149',
          border: `1px solid ${message.type === 'success' ? '#2ea043' : '#f85149'}`,
          fontSize: '14px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            {message.type === 'success' ? (
              <polyline points="20 6 9 17 4 12"/>
            ) : (
              <>
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </>
            )}
          </svg>
          {message.text}
        </div>
      )}

      {/* Add Vehicle Section */}
      {showAddForm && (
        <div className="recent-invoices-section" style={{ animation: 'fadeIn 0.3s ease-out' }}>
          <div className="recent-invoices-header" style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>Register New Vehicle</h3>
          </div>

          <form onSubmit={handleAddVehicle} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            
            {/* SEARCH OR CUSTOM DROP-DOWN INPUT */}
            <div style={{ gridColumn: '1 / -1', position: 'relative' }} ref={dropdownRef}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#888', fontSize: '13px', fontWeight: '600' }}>
                Search Vehicle Model or Type Custom Name *
              </label>
              
              <div style={{ position: 'relative' }}>
                {/* Custom Search Icon */}
                <svg 
                  style={{ width: '16px', height: '16px', color: '#8b949e', position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5"
                >
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>

                <input
                  type="text"
                  value={searchQuery}
                  placeholder="Type car name (e.g. Ford Mustang 2021)..."
                  onFocus={() => setIsOpen(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsOpen(true);
                    setCustomParsed(null);
                    if (newVehicle.vehicleId) {
                      setNewVehicle({ ...newVehicle, vehicleId: '' });
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 40px 12px 38px',
                    background: '#0d1117',
                    border: isOpen ? '1px solid #1890ff' : '1px solid #30363d',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '14px',
                    outline: 'none',
                    boxShadow: isOpen ? '0 0 10px rgba(24, 144, 255, 0.15)' : 'none',
                    transition: 'border 0.2s'
                  }}
                />
                
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setNewVehicle({ ...newVehicle, vehicleId: '' });
                      setCustomParsed(null);
                      setIsOpen(true);
                    }}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: '#8b949e',
                      cursor: 'pointer',
                      fontSize: '18px'
                    }}
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Enhanced Dropdown List */}
              {isOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: '#161b22',
                  border: '1px solid #30363d',
                  borderRadius: '8px',
                  marginTop: '6px',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  zIndex: 100,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  animation: 'fadeIn 0.15s ease-out'
                }}>
                  {/* Matching Catalog Items */}
                  {filteredVehicles.map(v => {
                    const name = v.displayName || `${v.make} ${v.model} (${v.year})`;
                    const isSelected = newVehicle.vehicleId === String(v.id);
                    return (
                      <div
                        key={v.id}
                        onClick={() => {
                          setNewVehicle({ ...newVehicle, vehicleId: String(v.id) });
                          setSearchQuery(name);
                          setCustomParsed(null);
                          setIsOpen(false);
                        }}
                        style={{
                          padding: '12px 16px',
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(24, 144, 255, 0.08)' : 'transparent',
                          borderBottom: '1px solid #21262d',
                          fontSize: '13.5px',
                          color: isSelected ? '#58a6ff' : '#c9d1d9',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.background = '#21262d';
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <span style={{ fontWeight: isSelected ? '600' : 'normal' }}>{name}</span>
                        {v.engineType && (
                          <span style={{ fontSize: '11px', color: '#8b949e', background: '#30363d', padding: '2px 6px', borderRadius: '4px' }}>
                            {v.engineType}
                          </span>
                        )}
                      </div>
                    );
                  })}

                  {/* Dynamic Custom Write-in Row */}
                  {searchQuery.trim() && (
                    <div
                      onClick={() => {
                        const parsed = parseVehicleInput(searchQuery);
                        if (parsed) {
                          setCustomParsed(parsed);
                          setNewVehicle({ ...newVehicle, vehicleId: '' });
                          setSearchQuery(`${parsed.make} ${parsed.model} (${parsed.year})`);
                        }
                        setIsOpen(false);
                      }}
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        background: 'rgba(24, 144, 255, 0.04)',
                        borderTop: filteredVehicles.length > 0 ? '2px solid #30363d' : 'none',
                        color: '#1890ff',
                        fontSize: '13.5px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(24, 144, 255, 0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(24, 144, 255, 0.04)';
                      }}
                    >
                      <svg style={{ width: '15px', height: '15px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      <span>Add custom car: "{searchQuery}"</span>
                    </div>
                  )}
                </div>
              )}

              {/* Real-time Custom Parser Confirmation Badge */}
              {customParsed && (
                <div style={{ 
                  marginTop: '10px',
                  background: 'rgba(24, 144, 255, 0.05)', 
                  border: '1px solid rgba(24, 144, 255, 0.15)', 
                  borderRadius: '6px', 
                  padding: '10px 14px', 
                  color: '#58a6ff', 
                  fontSize: '12.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <svg style={{ width: '15px', height: '15px', color: '#1890ff' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                  <span>
                    New vehicle parsed as: <strong>{customParsed.make}</strong> • <strong>{customParsed.model}</strong> (Year: <strong>{customParsed.year}</strong>)
                  </span>
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#888', fontSize: '13px', fontWeight: '600' }}>License Plate (Optional)</label>
              <input
                type="text"
                value={newVehicle.licensePlate}
                onChange={e => setNewVehicle({ ...newVehicle, licensePlate: e.target.value })}
                placeholder="e.g. BA-1-PA-1234"
                style={{ width: '100%', padding: '12px', background: '#0d1117', border: '1px solid #2f363d', borderRadius: '8px', color: '#fff', fontSize: '14px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#888', fontSize: '13px', fontWeight: '600' }}>Vehicle Color (Optional)</label>
              <input
                type="text"
                value={newVehicle.color}
                onChange={e => setNewVehicle({ ...newVehicle, color: e.target.value })}
                placeholder="e.g. Metallic Black"
                style={{ width: '100%', padding: '12px', background: '#0d1117', border: '1px solid #2f363d', borderRadius: '8px', color: '#fff', fontSize: '14px' }}
              />
            </div>

            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px', marginTop: '10px' }}>
              <button 
                type="submit" 
                className="btn-table-action" 
                style={{ background: '#52c41a', borderColor: '#52c41a', padding: '10px 24px', fontWeight: 'bold' }}
                disabled={submitting}
              >
                {submitting ? 'Registering...' : 'Add Vehicle'}
              </button>
              <button 
                type="button" 
                className="btn-table-action" 
                style={{ background: 'transparent', borderColor: '#2f363d' }}
                onClick={() => {
                  setShowAddForm(false);
                  setSearchQuery('');
                  setCustomParsed(null);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Vehicles Grid list */}
      <div className="recent-invoices-section">
        <div className="recent-invoices-header">
          <h3>Registered Vehicles ({myVehicles.length})</h3>
        </div>
        
        {myVehicles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--admin-text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <svg style={{ width: '48px', height: '48px', color: '#30363d', marginBottom: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
              <circle cx="7" cy="17" r="2"/>
              <circle cx="15" cy="17" r="2"/>
            </svg>
            <h4>Your Garage is empty</h4>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>Add your vehicles to easily check parts compatibility when buying online.</p>
            <button 
              onClick={() => {
                setShowAddForm(true);
                setSearchQuery('');
                setCustomParsed(null);
              }} 
              className="btn-table-action"
              style={{ marginTop: '16px', background: '#1890ff', borderColor: '#1890ff' }}
            >
              Add Your First Vehicle
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {myVehicles.map(v => (
              <div 
                key={v.id} 
                className="staff-kpi-card" 
                style={{ 
                  flexDirection: 'column', 
                  alignItems: 'stretch', 
                  gap: '15px', 
                  position: 'relative',
                  border: '1px solid #30363d',
                  background: '#161b22',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}
              >
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <div className="kpi-icon-wrapper parts" style={{ background: 'rgba(24, 144, 255, 0.08)', borderColor: 'rgba(24, 144, 255, 0.2)', color: '#1890ff' }}>
                    <svg style={{ width: '22px', height: '22px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
                      <circle cx="7" cy="17" r="2"/>
                      <circle cx="15" cy="17" r="2"/>
                    </svg>
                  </div>
                  <div>
                    <h4 style={{ margin: 0, color: '#fff', fontSize: '16px', fontWeight: '700' }}>
                      {v.displayName || `${v.make} ${v.model}`}
                    </h4>
                    <span style={{ fontSize: '12px', color: '#8b949e' }}>Year: {v.year || 'N/A'}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #30363d', paddingTop: '12px' }}>
                  {v.licensePlate ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                      <span style={{ color: '#8b949e' }}>Plate Number:</span>
                      <span style={{ 
                        background: '#0d1117', 
                        border: '1px solid #30363d', 
                        padding: '2px 8px', 
                        borderRadius: '4px', 
                        fontWeight: '700', 
                        letterSpacing: '0.5px',
                        color: '#58a6ff' 
                      }}>
                        {v.licensePlate}
                      </span>
                    </div>
                  ) : null}

                  {v.color ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                      <span style={{ color: '#8b949e' }}>Paint Color:</span>
                      <span style={{ color: '#fff', fontWeight: '500' }}>{v.color}</span>
                    </div>
                  ) : null}
                </div>

                <button 
                  onClick={() => handleDeleteVehicle(v.id)}
                  style={{
                    background: 'rgba(248, 81, 73, 0.08)',
                    border: '1px solid rgba(248, 81, 73, 0.2)',
                    color: '#f85149',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                    marginTop: '10px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(248, 81, 73, 0.15)';
                    e.currentTarget.style.borderColor = '#f85149';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(248, 81, 73, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(248, 81, 73, 0.2)';
                  }}
                >
                  <svg style={{ width: '13px', height: '13px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
                  </svg>
                  Remove Vehicle
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title="Remove Vehicle"
        message="Are you sure you want to remove this vehicle from your garage? This action cannot be undone."
        confirmText="Remove"
        onCancel={() => setConfirmModal({ isOpen: false, idToRemove: null })}
        onConfirm={executeDeleteVehicle}
      />
    </div>
  );
};

export default CustomerGaragePage;
