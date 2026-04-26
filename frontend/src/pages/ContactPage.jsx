import React from 'react';

function ContactPage() {
  return (
    <div className="container" style={{ padding: '60px 15px', minHeight: '60vh', maxWidth: '800px' }}>
      <h1 style={{ fontSize: '36px', marginBottom: '10px', color: 'var(--text-main)' }}>Contact Us</h1>
      <p style={{ fontSize: '16px', color: 'var(--text-muted)', marginBottom: '40px' }}>
        Have a question or need help finding a specific part? Fill out the form below and our team will get back to you.
      </p>

      <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1', minWidth: '300px' }}>
          <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Full Name</label>
              <input type="text" placeholder="John Doe" style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Email Address</label>
              <input type="email" placeholder="john@example.com" style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Message</label>
              <textarea placeholder="How can we help?" rows="5" style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', resize: 'vertical' }}></textarea>
            </div>
            <button type="submit" className="btn-primary" style={{ padding: '12px', marginTop: '10px' }}>Send Message</button>
          </form>
        </div>

        <div style={{ flex: '1', minWidth: '300px', backgroundColor: 'var(--bg-light)', padding: '30px', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '20px' }}>Store Information</h3>
          <div style={{ marginBottom: '15px' }}>
            <strong style={{ display: 'block', marginBottom: '5px' }}>Address</strong>
            <span style={{ color: 'var(--text-muted)' }}>123 Auto Parts Blvd,<br />Motor City, MI 48201</span>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <strong style={{ display: 'block', marginBottom: '5px' }}>Phone</strong>
            <span style={{ color: 'var(--text-muted)' }}>+1 (555) 123-4567</span>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <strong style={{ display: 'block', marginBottom: '5px' }}>Email</strong>
            <span style={{ color: 'var(--text-muted)' }}>nischayachamlingraii@gmail.com</span>
          </div>
          <div style={{ marginTop: '30px' }}>
            <strong style={{ display: 'block', marginBottom: '5px' }}>Business Hours</strong>
            <span style={{ color: 'var(--text-muted)' }}>Monday - Friday: 8AM - 6PM<br />Saturday: 9AM - 4PM</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactPage;
