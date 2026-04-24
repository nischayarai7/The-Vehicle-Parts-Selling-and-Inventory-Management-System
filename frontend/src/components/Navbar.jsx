import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { api } from '../services/api';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="container navbar-container">
        {/* Logo */}
        <div className="navbar-logo">
          <Link to="/">
            <h2>6IX7EVEN.</h2>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="navbar-search">
          <input type="text" placeholder="Search for products..." />
          <button className="search-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
            </svg>
          </button>
        </div>

        {/* Icons & Account */}
        <div className="navbar-actions">
          {isAuthenticated ? (
            <div className="user-menu">
              <Link to="/settings" className="nav-profile">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="nav-avatar" />
                ) : (
                  <div className="nav-avatar-placeholder">
                    {user?.fullName?.charAt(0) || 'U'}
                  </div>
                )}
                <span>{user?.fullName?.split(' ')[0] || 'User'}</span>
              </Link>
              <button onClick={handleLogout} className="logout-link">Logout</button>
            </div>
          ) : (
            <Link to="/login" className="login-link">Login / Register</Link>
          )}
          
          <div className="cart-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
              <path d="M0 1.5A.5.5 0 0 1 .5 1H2a.5.5 0 0 1 .485.379L2.89 3H14.5a.5.5 0 0 1 .491.592l-1.5 8A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L2.01 3.607 1.61 2H.5a.5.5 0 0 1-.5-.5zM3.102 4l1.313 7h8.17l1.313-7H3.102zM5 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm7 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-7 1a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm7 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
            </svg>
            <span className="cart-count">0</span>
          </div>
        </div>
      </div>
      
      {/* Bottom Navigation Row */}
      <div className="navbar-bottom">
        <div className="container nav-links-container">
          <button className="browse-categories-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/>
            </svg>
            Browse Categories
          </button>
          <ul className="nav-links">
            <li><Link to="/" className="active">Home</Link></li>
            <li><Link to="/shop">Shop</Link></li>
            {isAuthenticated && user?.role === 'Admin' && (
              <li>
                <Link to="/admin" className="dashboard-btn">
                  Dashboard
                </Link>
              </li>
            )}
            <li><Link to="/elements">Elements</Link></li>
            <li><Link to="/pages">Pages</Link></li>
            <li><Link to="/vendors">Vendors</Link></li>
          </ul>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
