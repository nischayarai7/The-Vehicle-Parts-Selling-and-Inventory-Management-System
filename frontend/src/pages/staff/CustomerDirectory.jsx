import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import './CustomerDirectory.css';

const SEARCH_FIELDS = [
  { value: '', label: 'All Fields' },
  { value: 'name', label: 'Name' },
  { value: 'phone', label: 'Phone Number' },
  { value: 'id', label: 'Customer ID' },
  { value: 'vehicle', label: 'Vehicle No.' },
];

const PLACEHOLDERS = {
  '': 'Search name, phone, ID, vehicle plate…',
  name: 'Search by customer name…',
  phone: 'Search by phone number…',
  id: 'Search by customer ID…',
  vehicle: 'Search by vehicle plate number…',
};

const CustomerDirectory = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState('');

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim()) {
        searchCustomers(searchTerm.trim(), searchField);
      } else {
        fetchCustomers();
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, searchField]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.getStaffCustomers();
      setCustomers(res);
    } catch (err) {
      console.error('Failed to fetch customers', err);
    } finally {
      setLoading(false);
    }
  };

  const searchCustomers = async (query, field) => {
    setLoading(true);
    try {
      const res = await api.searchStaffCustomers(query, field || null);
      setCustomers(res);
    } catch (err) {
      console.error('Failed to search customers', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (e) => {
    setSearchField(e.target.value);
    // Clear search term when switching fields for a clean start
    setSearchTerm('');
  };

  return (
    <div className="directory-container">
      {/* Header */}
      <div className="directory-page-header">
        <div>
          <h2>Customer Directory</h2>
          <p>Search registered accounts, view purchase ledgers, and manage garage logs.</p>
        </div>
        <div className="directory-actions-row">
          {/* Namespace (field) selector */}
          <div className="directory-field-selector">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M7 12h10M10 18h4"/>
            </svg>
            <select
              id="search-field-select"
              value={searchField}
              onChange={handleFieldChange}
              aria-label="Search namespace"
            >
              {SEARCH_FIELDS.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
            <svg className="select-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>

          {/* Search input */}
          <div className="directory-search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              id="customer-search-input"
              type={searchField === 'id' ? 'number' : 'text'}
              placeholder={PLACEHOLDERS[searchField]}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="search-clear-btn"
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>

          <Link to="/staff/register-customer" className="btn-new-customer">
            <svg style={{ width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Customer
          </Link>
        </div>
      </div>

      {/* Active filter badge */}
      {searchField && (
        <div className="directory-filter-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          Searching by: <strong>{SEARCH_FIELDS.find(f => f.value === searchField)?.label}</strong>
          <button onClick={() => { setSearchField(''); setSearchTerm(''); }} aria-label="Remove filter">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="directory-loader">
          <svg className="refresh-icon-svg spinning" style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
          <span>Loading client records...</span>
        </div>
      ) : (
        /* Table Card */
        <div className="directory-table-card">
          <div className="directory-table-wrapper">
            <table className="directory-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Joined Date</th>
                  <th>Total Orders</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: 'var(--admin-text-muted)', padding: '30px' }}>
                      No customers found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  customers.map(c => (
                    <tr key={c.id}>
                      <td className="customer-id-col">#{c.id}</td>
                      <td className="customer-name-col">{c.fullName}</td>
                      <td style={{ color: 'var(--admin-text-muted)' }}>{c.email}</td>
                      <td style={{ color: 'var(--admin-text-muted)' }}>{c.phoneNumber || '—'}</td>
                      <td style={{ color: 'var(--admin-text-muted)' }}>
                        {new Date(c.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td>
                        <span className="customer-orders-badge">
                          {c.totalOrders} order{c.totalOrders !== 1 ? 's' : ''}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link to={`/staff/customers/${c.id}`} className="btn-view-details">
                          View Details
                          <svg style={{ width: '12px', height: '12px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDirectory;

