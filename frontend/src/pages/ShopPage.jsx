import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import './ShopPage.css';

function ShopPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart, showToast } = useCart();

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
  const [searchQuery, setSearchQuery] = useState(searchParam);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    // Sync local dropdown states with search parameter updates
    setSelectedCategoryId(categoryParam);
    setSearchQuery(searchParam);
  }, [categoryParam, searchParam]);

  // Reset page on any filter or sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [makeParam, modelParam, yearParam, categoryParam, searchParam, sortBy]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchFilteredParts();
  }, [makeParam, modelParam, yearParam, categoryParam, searchParam]);

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

      // Priority 1: Vehicle Compatibility Filter (Make, Model, Year)
      if (makeParam && modelParam && yearParam) {
        const matchingVehicle = vehicles.find(
          v => v.make.toLowerCase() === makeParam.toLowerCase() &&
               v.model.toLowerCase() === modelParam.toLowerCase() &&
               v.year.toString() === yearParam.toString()
        );

        if (matchingVehicle) {
          fetchedParts = await api.getCompatibleParts(matchingVehicle.id);
        } else {
          // If vehicles list hasn't loaded yet or no exact DB match, query vehicles first or search by model
          const allVehicles = await api.getVehicles();
          const freshMatch = allVehicles.find(
            v => v.make.toLowerCase() === makeParam.toLowerCase() &&
                 v.model.toLowerCase() === modelParam.toLowerCase() &&
                 v.year.toString() === yearParam.toString()
          );
          if (freshMatch) {
            fetchedParts = await api.getCompatibleParts(freshMatch.id);
          } else {
            fetchedParts = []; // No matching vehicle in DB
          }
        }
      } 
      // Priority 2: Keyword search term
      else if (searchParam) {
        fetchedParts = await api.searchParts(searchParam);
      } 
      // Priority 3: Fetch all active catalog parts
      else {
        fetchedParts = await api.getAllParts();
      }

      // Filter by Category locally or backend (fallback logic)
      if (categoryParam) {
        fetchedParts = fetchedParts.filter(
          part => part.categoryId.toString() === categoryParam.toString()
        );
      }

      // Ensure we only show Active parts
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

  // Keyword Search Refiner
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchQuery.trim()) {
      newParams.set('search', searchQuery.trim());
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams);
  };

  // Clear Compatibility Filters
  const clearGarageFilter = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('make');
    newParams.delete('model');
    newParams.delete('year');
    setSearchParams(newParams);
  };

  // Sorting Logic
  const getSortedParts = () => {
    const sorted = [...parts];
    if (sortBy === 'price-low') {
      return sorted.sort((a, b) => a.price - b.price);
    }
    if (sortBy === 'price-high') {
      return sorted.sort((a, b) => b.price - a.price);
    }
    if (sortBy === 'name-az') {
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    return sorted; // featured or default
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 2
    }).format(amount).replace('NPR', 'Rs.');
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
            className="btn-secondary" 
            onClick={() => {
              if (makeParam) clearGarageFilter();
              else {
                const newParams = new URLSearchParams(searchParams);
                newParams.delete('search');
                setSearchParams(newParams);
              }
            }}
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            Clear Filter ✕
          </button>
        </div>
      )}

      <div className="shop-header">
        <h1>All Vehicle Parts Catalog</h1>

        <div className="shop-filters">
          {/* Inner Search Field */}
          <form onSubmit={handleSearchSubmit} className="shop-inner-search" style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              placeholder="Refine search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '10px 15px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                background: 'var(--bg-main)',
                color: 'var(--text-main)',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            <button type="submit" className="btn-primary" style={{ padding: '10px 15px' }}>Refine</button>
          </form>

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
        <>
          <div className="shop-results-info">
            Showing <strong>{indexOfFirst + 1}</strong>–<strong>{Math.min(indexOfLast, sortedPartsList.length)}</strong> of <strong>{sortedPartsList.length}</strong> parts
          </div>

          <div className="shop-grid">
            {currentPageParts.map((part) => (
              <div key={part.id} className="product-card">
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
