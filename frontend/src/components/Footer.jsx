import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-col brand-col">
          <h2 className="footer-logo">6IX7EVEN.</h2>
          <p className="footer-desc">
            We provide the best vehicle parts for all brands. High quality, affordable prices, and excellent customer service.
          </p>
          <div className="contact-info">
            <p><strong>Address:</strong> 123 Auto Parts Street, City</p>
            <p><strong>Phone:</strong> +1 234 567 8900</p>
            <p><strong>Email:</strong> support@6ix7even.com</p>
          </div>
        </div>

        <div className="footer-col links-col">
          <h3>Information</h3>
          <ul>
            <li><a href="#">About Us</a></li>
            <li><a href="#">Delivery Information</a></li>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms & Conditions</a></li>
            <li><a href="#">Contact Us</a></li>
          </ul>
        </div>

        <div className="footer-col links-col">
          <h3>My Account</h3>
          <ul>
            <li><a href="#">Sign In</a></li>
            <li><a href="#">View Cart</a></li>
            <li><a href="#">My Wishlist</a></li>
            <li><a href="#">Track My Order</a></li>
            <li><a href="#">Help</a></li>
          </ul>
        </div>

        <div className="footer-col newsletter-col">
          <h3>Newsletter Signup</h3>
          <p>Join our newsletter to get updates on new products and sales.</p>
          <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="Your Email Address" required />
            <button type="submit" className="btn-primary">Subscribe</button>
          </form>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container bottom-container">
          <p>&copy; {new Date().getFullYear()} 6ix7even Auto Parts. All Rights Reserved.</p>
          <div className="payment-methods">
            {/* Payment icons placeholder */}
            <span>💳</span> <span>🏦</span> <span>💵</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
