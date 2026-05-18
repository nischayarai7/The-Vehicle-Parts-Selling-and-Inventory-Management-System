import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import './ShopPage.css';

function ShopPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart, showToast } = useCart();

  const handleBuyNow = (part) => {
    if (part.stockQuantity <= 0) {
      showToast('This item is currently out of stock.', 'error');
      return;
    }
    addToCart(part);
    showToast('Item ready for checkout!', 'success');
  };

  // State arrays
  const [parts, setParts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active filters and query parameters
  const makeParam = searchParams.get('make') || '';
  const modelParam = searchParams.get('model') || '';
  const yearParam = searchParams.get('year') || '';
  const categoryParam = searchParams.get('category') || '';
  const searchParam = searchParams.get('search') || '';

  // Local drop-down values
  const [selectedCategoryId, setSelectedCategoryId] = useState(categoryParam);
  const [sortBy, setSortBy] = useState('featured');
  const [selectedMake, setSelectedMake] = useState(makeParam);
  const [selectedModel, setSelectedModel] = useState(modelParam);
  const [selectedYear, setSelectedYear] = useState(yearParam);
  const [liveSearchQuery, setLiveSearchQuery] = useState(searchParam);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    // Sync local dropdown states with search parameter updates
    setSelectedCategoryId(categoryParam);
    setSelectedMake(makeParam);
    setSelectedModel(modelParam);
    setSelectedYear(yearParam);
    setLiveSearchQuery(searchParam);
  }, [categoryParam, searchParam, makeParam, modelParam, yearParam]);

  // Reset page on any filter or sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [makeParam, modelParam, yearParam, categoryParam, searchParam, sortBy]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchFilteredParts();
  }, [makeParam, modelParam, yearParam, vehicles]);

  const fetchInitialData = async () => {
    try {
      const [catsData, vehiclesData] = await Promise.all([
        api.getActiveCategories(),
        api.getVehicles()
      ]);
      setCategories(catsData);
      setVehicles(vehiclesData);
    } catch (err) {
      console.error('Error fetching initial shop data:', err);
    }
  };

  const fetchFilteredParts = async () => {
    setLoading(true);
    try {
      let fetchedParts = [];

      // Fetch compatible parts if vehicle filter is present
      if (makeParam && modelParam && yearParam) {
        const matchingVehicle = vehicles.find(
          v => v.make.toLowerCase() === makeParam.toLowerCase() &&
               v.model.toLowerCase() === modelParam.toLowerCase() &&
               v.year.toString() === yearParam.toString()
        );

        if (matchingVehicle) {
          fetchedParts = await api.getCompatibleParts(matchingVehicle.id);
        } else {
          // If vehicles list hasn't loaded yet, fetch directly
          const allVehicles = await api.getVehicles();
          const freshMatch = allVehicles.find(
            v => v.make.toLowerCase() === makeParam.toLowerCase() &&
                 v.model.toLowerCase() === modelParam.toLowerCase() &&
                 v.year.toString() === yearParam.toString()
          );
          if (freshMatch) {
            fetchedParts = await api.getCompatibleParts(freshMatch.id);
          } else {
            fetchedParts = [];
          }
        }
      } 
      // Otherwise fetch the entire active catalog
      else {
        fetchedParts = await api.getAllParts();
      }

      // Filter active parts only
      fetchedParts = fetchedParts.filter(part => part.isActive);

      setParts(fetchedParts);
    } catch (err) {
      console.error('Error fetching filtered parts:', err);
      showToast('Failed to load parts from the catalog.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Category Selector Change Handler
  const handleCategoryChange = (e) => {
    const value = e.target.value;
    setSelectedCategoryId(value);

    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set('category', value);
    } else {
      newParams.delete('category');
    }
    setSearchParams(newParams);
  };



  // Clear Compatibility Filters
  const clearGarageFilter = () => {
    setSelectedMake('');
    setSelectedModel('');
    setSelectedYear('');
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('make');
    newParams.delete('model');
    newParams.delete('year');
    setSearchParams(newParams);
  };

  // Calculate unique Makes, Models, and Years for dropdown selectors
  const makes = [...new Set(vehicles.map(v => v.make))].sort();
  const models = [...new Set(vehicles.filter(v => v.make === selectedMake).map(v => v.model))].sort();
  const years = [...new Set(vehicles.filter(v => v.make === selectedMake && v.model === selectedModel).map(v => v.year))].sort((a, b) => b - a);

  // Apply Vehicle Compatibility Filter
  const handleApplyVehicleFilter = (make, model, year) => {
    const newParams = new URLSearchParams(searchParams);
    if (make && model && year) {
      newParams.set('make', make);
      newParams.set('model', model);
      newParams.set('year', year);
      newParams.delete('search'); // Clear textual search to keep catalog focus
    } else {
      newParams.delete('make');
      newParams.delete('model');
      newParams.delete('year');
    }
    setSearchParams(newParams);
  };

  // Sorting Logic
  // Dynamic live search and sorting
  const getSortedParts = () => {
    let result = [...parts];

    // Filter by Category client-side instantly
    if (selectedCategoryId) {
      result = result.filter(
        part => part.categoryId.toString() === selectedCategoryId.toString()
      );
    }

    // Instantly filter results client-side for immediate responsive feedback
    if (liveSearchQuery.trim()) {
      const q = liveSearchQuery.toLowerCase();
      result = result.filter(part => 
        part.name.toLowerCase().includes(q) ||
        (part.brand && part.brand.toLowerCase().includes(q)) ||
        (part.categoryName && part.categoryName.toLowerCase().includes(q)) ||
        (part.description && part.description.toLowerCase().includes(q)) ||
        part.partNumber.toLowerCase().includes(q)
      );
    }

    if (sortBy === 'price-low') {
      return result.sort((a, b) => a.price - b.price);
    }
    if (sortBy === 'price-high') {
      return result.sort((a, b) => b.price - a.price);
    }
    if (sortBy === 'name-az') {
      return result.sort((a, b) => a.name.localeCompare(b.name));
    }
    return result; // featured or default
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 2
    }).format(amount).replace('NPR', 'Rs.');
  };

  const getCompatibilityText = (vehiclesList) => {
    if (!vehiclesList || vehiclesList.length === 0) return 'Universal';
    const displayList = vehiclesList.slice(0, 2).map(v => `${v.make} ${v.model}`).join(', ');
    if (vehiclesList.length > 2) {
      return `${displayList} (+${vehiclesList.length - 2} more)`;
    }
    return displayList;
  };

  const sortedPartsList = getSortedParts();

  // Pagination calculations
  const totalPages = Math.ceil(sortedPartsList.length / ITEMS_PER_PAGE);
  const indexOfFirst = (currentPage - 1) * ITEMS_PER_PAGE;
  const indexOfLast = indexOfFirst + ITEMS_PER_PAGE;
  const currentPageParts = sortedPartsList.slice(indexOfFirst, indexOfLast);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, currentPage - 2);
      let end = Math.min(totalPages - 1, currentPage + 2);
      if (currentPage <= 3) end = 5;
      else if (currentPage >= totalPages - 2) start = totalPages - 4;
      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="container shop-page">
      {/* Top Breadcrumb or Search Description Banner */}
      {(makeParam || searchParam) && (
        <div className="shop-search-banner" style={{ background: '#181818', border: '1px solid #222', borderRadius: '8px', padding: '16px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ margin: 0, color: '#888', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Catalog Filter</h4>
            <p style={{ margin: '4px 0 0 0', color: '#fff', fontSize: '1.05rem', fontWeight: 600 }}>
              {makeParam ? `Parts compatible with ${makeParam} ${modelParam} (${yearParam})` : `Search results for "${searchParam}"`}
            </p>
          </div>
          <button 
            className="btn-clear-filter" 
            onClick={() => {
              if (makeParam) clearGarageFilter();
              else {
                const newParams = new URLSearchParams(searchParams);
                newParams.delete('search');
                setSearchParams(newParams);
              }
            }}
          >
            Clear Filter ✕
          </button>
        </div>
      )}

      <div className="shop-header">
        <h1>All Vehicle Parts Catalog</h1>

        <div className="shop-filters">
          {/* Instant Live Search Bar */}
          <div className="live-search-wrapper">
            <svg className="live-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              className="live-search-input"
              placeholder="Search parts catalog..."
              value={liveSearchQuery}
              onChange={(e) => {
                setLiveSearchQuery(e.target.value);
                const newParams = new URLSearchParams(searchParams);
                if (e.target.value) {
                  newParams.set('search', e.target.value);
                } else {
                  newParams.delete('search');
                }
                setSearchParams(newParams, { replace: true });
              }}
            />
            {liveSearchQuery && (
              <button 
                type="button" 
                className="live-search-clear"
                onClick={() => {
                  setLiveSearchQuery('');
                  const newParams = new URLSearchParams(searchParams);
                  newParams.delete('search');
                  setSearchParams(newParams, { replace: true });
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <select value={selectedCategoryId} onChange={handleCategoryChange}>
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          {/* Sort Dropdown */}
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="featured">Sort by: Featured</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="name-az">Name: A to Z</option>
          </select>
        </div>

        {/* Vehicle Compatibility Filter Bar */}
        <div className="shop-vehicle-filter-bar" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--admin-border, #2f363d)', borderRadius: '8px', padding: '12px 16px', marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '13.5px', fontWeight: '600' }}>
            <svg style={{ width: '16px', height: '16px', color: 'var(--primary, #e33b3b)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="7" cy="21" r="2"/><circle cx="17" cy="21" r="2"/><path d="M19 11v-4a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v4"/><path d="M14 5v-2"/></svg>
            <span>Compatible Vehicle Filter:</span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', flex: 1 }}>
            <select 
              value={selectedMake} 
              onChange={e => { setSelectedMake(e.target.value); setSelectedModel(''); setSelectedYear(''); }}
              style={{ padding: '8px 12px', background: '#0d1117', border: '1px solid var(--admin-border, #2f363d)', borderRadius: '6px', color: '#fff', fontSize: '13px', minWidth: '130px', outline: 'none' }}
            >
              <option value="">-- Choose Make --</option>
              {makes.map(m => <option key={m} value={m}>{m}</option>)}
            </select>

            <select 
              value={selectedModel} 
              onChange={e => { setSelectedModel(e.target.value); setSelectedYear(''); }}
              disabled={!selectedMake}
              style={{ padding: '8px 12px', background: '#0d1117', border: '1px solid var(--admin-border, #2f363d)', borderRadius: '6px', color: '#fff', fontSize: '13px', minWidth: '130px', outline: 'none', opacity: selectedMake ? 1 : 0.5 }}
            >
              <option value="">-- Choose Model --</option>
              {models.map(m => <option key={m} value={m}>{m}</option>)}
            </select>

            <select 
              value={selectedYear} 
              onChange={e => {
                const year = e.target.value;
                setSelectedYear(year);
                if (year) {
                  handleApplyVehicleFilter(selectedMake, selectedModel, year);
                }
              }}
              disabled={!selectedModel}
              style={{ padding: '8px 12px', background: '#0d1117', border: '1px solid var(--admin-border, #2f363d)', borderRadius: '6px', color: '#fff', fontSize: '13px', minWidth: '110px', outline: 'none', opacity: selectedModel ? 1 : 0.5 }}
            >
              <option value="">-- Choose Year --</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>

          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <p style={{ color: '#888' }}>Refreshing parts database...</p>
        </div>
      ) : sortedPartsList.length === 0 ? (
        <div className="empty-catalog-state" style={{ background: '#111', border: '1px dashed #222', borderRadius: '12px', padding: '60px 20px', textAlign: 'center', color: '#888' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="currentColor" viewBox="0 0 16 16" style={{ opacity: 0.2, marginBottom: '20px' }}>
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
            <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.962 1.354-.569.412-1.258.906-1.258 1.948v.177c0 .126.1.229.223.229h1.166a.227.227 0 0 0 .227-.225v-.136c0-.626.233-.91.815-1.34.611-.452 1.385-.975 1.385-2.33 0-1.602-1.298-2.612-3.136-2.612-1.92 0-3.23 1.09-3.374 2.85zM8 13.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
          </svg>
          <h3>No Matching Parts Found</h3>
          <p style={{ margin: '8px 0 24px 0', fontSize: '0.9rem' }}>We couldn't find any active parts matching your vehicle compatibility filters or search query.</p>
          <button 
            className="btn-primary" 
            onClick={() => {
              setSearchParams({});
              setSearchQuery('');
            }}
          >
            Clear All Filters
          </button>
        </div>
      ) : (
<<<<<<< HEAD
        <div className="shop-grid">
          {sortedPartsList.map((part) => (
            <div key={part.id} className="product-card">
              <Link to={`/shop/part/${part.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
=======
        <>
          <div className="shop-results-info">
            Showing <strong>{indexOfFirst + 1}</strong>–<strong>{Math.min(indexOfLast, sortedPartsList.length)}</strong> of <strong>{sortedPartsList.length}</strong> parts
          </div>

          <div className="shop-grid">
            {currentPageParts.map((part) => (
              <div key={part.id} className="product-card">
>>>>>>> 73c7192f1d2e17f0f8961318d418a0b984929601
                <div className="product-image-wrapper">
                  <img 
                    src={part.imageUrl || `https://ui-avatars.com/api/?name=${part.name}&background=fff&color=e33b3b&size=300`} 
                    alt={part.name} 
                    className="product-image" 
                    onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${part.name}&background=fff&color=e33b3b&size=300` }}
                  />
                  <div className="product-category-tag">{part.categoryName}</div>
                  {part.isLowStock && part.stockQuantity > 0 && (
                    <div style={{ position: 'absolute', top: '15px', right: '15px', background: '#e3b33b', color: '#000', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                      Low Stock
                    </div>
                  )}
                  {part.stockQuantity <= 0 && (
                    <div style={{ position: 'absolute', top: '15px', right: '15px', background: '#f85149', color: '#fff', padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                      Out of Stock
                    </div>
<<<<<<< HEAD
                  )}
                </div>
              </Link>
              <div className="product-info">
                <Link to={`/shop/part/${part.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                  <h3 style={{ minHeight: '44px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', cursor: 'pointer' }}>{part.name}</h3>
                </Link>
                <p style={{ fontSize: '12px', color: '#666', margin: '-10px 0 8px 0' }}>Part No: {part.partNumber || 'N/A'}</p>
                <div style={{ fontSize: '11px', color: '#e33b3b', margin: '-4px 0 14px 0', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16" style={{ flexShrink: 0, marginTop: '-1px' }}>
                    <path d="M4 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0zm8 0a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM0 6h16v1a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V6zm1.5-1.5A.5.5 0 0 1 2 4h12a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5H2a.5.5 0 0 1-.5-.5v-1z"/>
                    <path d="M2.52 3.862c.19-.626.78-1.056 1.436-1.056h8.088c.657 0 1.248.43 1.438 1.056l1.24 4.092c.09.296-.06.602-.34.697a.49.49 0 0 1-.606-.31L12.52 4.195a.498.498 0 0 0-.476-.34H3.956a.498.498 0 0 0-.476.34L2.24 8.286a.491.491 0 0 1-.607.31c-.28-.095-.43-.401-.34-.697l1.24-4.092z"/>
                  </svg>
                  <span>Fits: {getCompatibilityText(part.compatibleVehicles)}</span>
                </div>
                <div className="product-price-row" style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'stretch', width: '100%' }}>
                  <span className="price">{formatCurrency(part.price)}</span>
                  {part.stockQuantity <= 0 ? (
                    <button className="btn-secondary add-to-cart-btn" disabled style={{ opacity: 0.5, cursor: 'not-allowed', width: '100%' }}>
                      Sold Out
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px', width: '100%', alignItems: 'center' }}>
                      <button 
                        className="btn-primary add-to-cart-btn" 
                        onClick={() => handleBuyNow(part)}
                        style={{ flex: 1, padding: '0 12px', fontSize: '13px', height: '36px', margin: 0 }}
                      >
                        Buy Now
                      </button>
                      <button 
                        className="btn-add-to-cart-icon-small" 
                        onClick={() => { addToCart(part); showToast(`${part.name} added!`, 'success'); }}
                        title="Add to cart"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5zM3.102 4l1.313 7h8.17l1.313-7H3.102zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                        </svg>
                      </button>
                    </div>
=======
>>>>>>> 73c7192f1d2e17f0f8961318d418a0b984929601
                  )}
                </div>
                <div className="product-info">
                  <h3 style={{ minHeight: '44px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{part.name}</h3>
                  <p style={{ fontSize: '12px', color: '#666', margin: '-10px 0 15px 0' }}>Part No: {part.partNumber || 'N/A'}</p>
                  <div className="product-price-row">
                    <span className="price">{formatCurrency(part.price)}</span>
                    {part.stockQuantity <= 0 ? (
                      <button className="btn-secondary add-to-cart-btn" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                        Sold Out
                      </button>
                    ) : (
                      <button 
                        className="btn-primary add-to-cart-btn" 
                        onClick={() => addToCart(part)}
                      >
                        Add to Cart
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Shop Pagination Controls */}
          {totalPages > 1 && (
            <div className="shop-pagination-container">
              <button
                className="btn-shop-pagination btn-shop-pagination-nav"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                Prev
              </button>

              {getPageNumbers().map((page, idx) =>
                page === '...' ? (
                  <span key={`ellipsis-${idx}`} className="shop-pagination-ellipsis">...</span>
                ) : (
                  <button
                    key={`shop-page-${page}`}
                    className={`btn-shop-pagination ${currentPage === page ? 'active' : ''}`}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                className="btn-shop-pagination btn-shop-pagination-nav"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ShopPage;
