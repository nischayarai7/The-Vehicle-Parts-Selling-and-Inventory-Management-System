import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../../services/api';
import './VehiclesManager.css';

const VehiclesManager = () => {
  const context = useOutletContext() || {};
  const globalSearchTerm = context.searchTerm || '';
  
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [notification, setNotification] = useState(null);

  // Form States
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    trim: '',
    engineType: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [localSearch, setLocalSearch] = useState('');
  const [selectedMakeFilter, setSelectedMakeFilter] = useState('All');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset page when search or brand filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [localSearch, selectedMakeFilter, globalSearchTerm]);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const data = await api.getVehicles();
      setVehicles(data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      showNotification('Failed to load vehicles list', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Form input validation
  const validateForm = () => {
    const errors = {};
    if (!formData.make.trim()) errors.make = 'Make is required (e.g. Toyota)';
    if (!formData.model.trim()) errors.model = 'Model is required (e.g. Hilux)';
    
    const yearNum = parseInt(formData.year);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear() + 2) {
      errors.year = `Year must be between 1900 and ${new Date().getFullYear() + 2}`;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const payload = {
        ...formData,
        year: parseInt(formData.year),
        make: formData.make.trim(),
        model: formData.model.trim(),
        trim: formData.trim.trim() || null,
        engineType: formData.engineType.trim() || null
      };

      await api.addVehicle(payload);
      showNotification(`Successfully added vehicle: ${payload.year} ${payload.make} ${payload.model}`);
      setShowModal(false);
      
      // Reset form
      setFormData({
        make: '',
        model: '',
        year: new Date().getFullYear(),
        trim: '',
        engineType: ''
      });
      
      fetchVehicles();
    } catch (error) {
      console.error('Error creating vehicle:', error);
      const errMsg = error.message || 'Failed to register new vehicle model configuration';
      showNotification(errMsg, 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteVehicle(id);
      showNotification('Vehicle deleted successfully');
      setDeletingId(null);
      fetchVehicles();
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      showNotification(error.message || 'Failed to delete vehicle', 'error');
      setDeletingId(null);
    }
  };

  // Unique list of makes for filter dropdown
  const uniqueMakes = useMemo(() => {
    const makesSet = new Set(vehicles.map(v => v.make));
    return ['All', ...Array.from(makesSet).sort()];
  }, [vehicles]);

  // Dynamic dashboard stats calculations
  const stats = useMemo(() => {
    const uniqueBrands = new Set(vehicles.map(v => v.make.toLowerCase())).size;
    const uniqueModels = new Set(vehicles.map(v => v.model.toLowerCase())).size;
    const newestVehicle = vehicles.length > 0 
      ? [...vehicles].sort((a, b) => b.id - a.id)[0] 
      : null;

    return {
      totalVehicles: vehicles.length,
      totalBrands: uniqueBrands,
      totalModels: uniqueModels,
      newest: newestVehicle ? `${newestVehicle.year} ${newestVehicle.make} ${newestVehicle.model}` : 'N/A'
    };
  }, [vehicles]);

  // Combined local search, global search, and make filtering
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const searchKey = `${v.make} ${v.model} ${v.year} ${v.trim || ''} ${v.engineType || ''}`.toLowerCase();
      const matchSearch = searchKey.includes(localSearch.toLowerCase()) && searchKey.includes(globalSearchTerm.toLowerCase());
      const matchMake = selectedMakeFilter === 'All' || v.make.toLowerCase() === selectedMakeFilter.toLowerCase();
      return matchSearch && matchMake;
    });
  }, [vehicles, localSearch, globalSearchTerm, selectedMakeFilter]);

  // Paginated chunks calculation
  const totalPages = useMemo(() => {
    return Math.ceil(filteredVehicles.length / pageSize) || 1;
  }, [filteredVehicles, pageSize]);

  const paginatedVehicles = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredVehicles.slice(start, start + pageSize);
  }, [filteredVehicles, currentPage, pageSize]);

  const pageRange = useMemo(() => {
    const range = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      range.push(i);
    }
    return range;
  }, [currentPage, totalPages]);

  return (
    <div className="vehicles-manager">
      {/* Header Block */}
      <div className="vehicles-header">
        <div>
          <h2>Vehicle Registry</h2>
          <p className="subtitle">View, search, and manage global vehicle compatibility models in the system.</p>
        </div>
        <button className="btn-add-vehicle" onClick={() => setShowModal(true)}>
          <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add New Vehicle
        </button>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`notification-toast ${notification.type}`}>
          <div className="toast-glow"></div>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Stats Dashboard Grid */}
      <div className="stats-dashboard-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper red">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-1.1 0-2 .9-2 2v7c0 .6.4 1 1 1h3M9 17a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm11 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/>
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.totalVehicles}</div>
            <div className="stat-label">Total Vehicles</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper orange">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.totalBrands}</div>
            <div className="stat-label">Active Brands</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1v12zM4 22v-7"/>
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value">{stats.totalModels}</div>
            <div className="stat-label">Vehicle Models</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div className="stat-info">
            <div className="stat-value truncate" title={stats.newest}>{stats.newest}</div>
            <div className="stat-label">Newest Addition</div>
          </div>
        </div>
      </div>

      {/* Search and Filters Header */}
      <div className="vehicles-filter-bar">
        <div className="search-wrapper">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input 
            type="text" 
            placeholder="Search by make, model, year, trim..." 
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Filter by Brand:</label>
          <select 
            value={selectedMakeFilter}
            onChange={(e) => setSelectedMakeFilter(e.target.value)}
          >
            {uniqueMakes.map(make => (
              <option key={make} value={make}>{make}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Table Grid */}
      <div className="vehicles-table-card">
        {loading ? (
          <div className="table-loading">
            <div className="spinner"></div>
            <span>Fetching compatible vehicles database...</span>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="table-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <h3>No Vehicles Found</h3>
            <p>Try adjusting your search filters or add a new vehicle model configuration.</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="premium-admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Year</th>
                    <th>Make (Brand)</th>
                    <th>Model</th>
                    <th>Trim</th>
                    <th>Engine Type</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedVehicles.map((vehicle) => (
                    <tr key={vehicle.id}>
                      <td className="vehicle-id">#{vehicle.id}</td>
                      <td className="vehicle-year">{vehicle.year}</td>
                      <td className="vehicle-make">{vehicle.make}</td>
                      <td className="vehicle-model">{vehicle.model}</td>
                      <td className="vehicle-trim">{vehicle.trim || <span className="null-indicator">-</span>}</td>
                      <td className="vehicle-engine">{vehicle.engineType || <span className="null-indicator">-</span>}</td>
                      <td className="vehicle-actions" style={{ textAlign: 'right' }}>
                        <button 
                          className="btn-delete-row"
                          onClick={() => setDeletingId(vehicle.id)}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="table-pagination-footer">
              <div className="pagination-info">
                Showing <span>{filteredVehicles.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> to{' '}
                <span>{Math.min(filteredVehicles.length, currentPage * pageSize)}</span> of{' '}
                <span>{filteredVehicles.length}</span> vehicle configurations
              </div>

              <div className="pagination-controls-wrapper">
                <div className="page-size-selector">
                  <label>Show:</label>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(parseInt(e.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                <div className="pagination-buttons">
                  <button
                    className="btn-page-nav"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    title="First Page"
                  >
                    &laquo;
                  </button>
                  <button
                    className="btn-page-nav"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    title="Previous Page"
                  >
                    &lsaquo;
                  </button>

                  {pageRange.map(p => (
                    <button
                      key={p}
                      className={`btn-page-num ${currentPage === p ? 'active' : ''}`}
                      onClick={() => setCurrentPage(p)}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    className="btn-page-nav"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    title="Next Page"
                  >
                    &rsaquo;
                  </button>
                  <button
                    className="btn-page-nav"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    title="Last Page"
                  >
                    &raquo;
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Add New Vehicle Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Register New Vehicle Model</h3>
              <button className="btn-close-modal" onClick={() => { setShowModal(false); setFormErrors({}); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group-row">
                  <div className="form-group">
                    <label>Vehicle Make (Brand)*</label>
                    <input 
                      type="text" 
                      name="make"
                      placeholder="e.g. Lamborghini, Toyota" 
                      value={formData.make}
                      onChange={handleInputChange}
                      className={formErrors.make ? 'input-error' : ''}
                    />
                    {formErrors.make && <span className="error-text">{formErrors.make}</span>}
                  </div>

                  <div className="form-group">
                    <label>Model Name*</label>
                    <input 
                      type="text" 
                      name="model"
                      placeholder="e.g. Huracan, Hilux" 
                      value={formData.model}
                      onChange={handleInputChange}
                      className={formErrors.model ? 'input-error' : ''}
                    />
                    {formErrors.model && <span className="error-text">{formErrors.model}</span>}
                  </div>
                </div>

                <div className="form-group-row">
                  <div className="form-group">
                    <label>Release Year*</label>
                    <input 
                      type="number" 
                      name="year"
                      placeholder="e.g. 2020" 
                      value={formData.year}
                      onChange={handleInputChange}
                      className={formErrors.year ? 'input-error' : ''}
                    />
                    {formErrors.year && <span className="error-text">{formErrors.year}</span>}
                  </div>

                  <div className="form-group">
                    <label>Trim / Sub-Model (Optional)</label>
                    <input 
                      type="text" 
                      name="trim"
                      placeholder="e.g. LP610-4, SR5, V8" 
                      value={formData.trim}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Engine Capacity / Type (Optional)</label>
                  <input 
                    type="text" 
                    name="engineType"
                    placeholder="e.g. 5.2L V10, 2.8L Turbo Diesel" 
                    value={formData.engineType}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-cancel" 
                  onClick={() => { setShowModal(false); setFormErrors({}); }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Save Vehicle Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="modal-overlay">
          <div className="delete-confirm-container">
            <div className="confirm-icon-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <h3>Are you absolutely sure?</h3>
            <p>Deleting this vehicle will remove all of its relational model compatibility mappings inside the database. This action cannot be undone.</p>
            <div className="confirm-actions">
              <button className="btn-cancel" onClick={() => setDeletingId(null)}>
                No, Keep Vehicle
              </button>
              <button className="btn-confirm-delete" onClick={() => handleDelete(deletingId)}>
                Yes, Delete Config
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehiclesManager;
