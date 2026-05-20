import React, { useState } from 'react';
import { api } from '../services/api';

function ContactPage() {
  const [formData, setFormData] = useState({ fullName: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [storeSettings, setStoreSettings] = useState(null);

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await api.getStoreSettings();
        setStoreSettings(data);
      } catch (err) {
        console.error('Failed to load store settings:', err);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Basic frontend checks
    if (!formData.fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!formData.email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError('Please provide a valid email address.');
      return;
    }
    if (!formData.message.trim() || formData.message.trim().length < 10) {
      setError('Your message must be at least 10 characters long.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.submitContactForm({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        message: formData.message.trim(),
      });
      
      setSuccess(response.message || 'Thank you! Your message has been sent successfully. A confirmation receipt has been sent to your email.');
      setFormData({ fullName: '', email: '', message: '' });
    } catch (err) {
      console.error('Contact submit error:', err);
      setError(err.message || 'Failed to send your message. Please verify your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '60px 15px', minHeight: '60vh', maxWidth: '800px' }}>
      <h1 style={{ fontSize: '36px', marginBottom: '10px', color: 'var(--text-main)' }}>Contact Us</h1>
      <p style={{ fontSize: '16px', color: 'var(--text-muted)', marginBottom: '40px' }}>
        Have a question or need help finding a specific part? Fill out the form below and our team will get back to you.
      </p>

      <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1', minWidth: '300px' }}>
          {success && (
            <div style={{ 
              background: 'rgba(46, 160, 67, 0.15)', 
              border: '1px solid #2ea043', 
              borderRadius: '4px', 
              padding: '12px', 
              marginBottom: '20px', 
              color: '#3fb950', 
              fontSize: '14px' 
            }}>
              {success}
            </div>
          )}

          {error && (
            <div style={{ 
              background: 'rgba(248, 81, 73, 0.15)', 
              border: '1px solid #f85149', 
              borderRadius: '4px', 
              padding: '12px', 
              marginBottom: '20px', 
              color: '#ff7b72', 
              fontSize: '14px' 
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Full Name</label>
              <input 
                type="text" 
                name="fullName"
                placeholder="John Doe" 
                value={formData.fullName}
                onChange={handleChange}
                disabled={loading}
                style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-main)', color: 'var(--text-main)' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Email Address</label>
              <input 
                type="email" 
                name="email"
                placeholder="john@example.com" 
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-main)', color: 'var(--text-main)' }} 
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Message</label>
              <textarea 
                name="message"
                placeholder="How can we help?" 
                rows="5" 
                value={formData.message}
                onChange={handleChange}
                disabled={loading}
                style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid var(--border-color)', outline: 'none', resize: 'vertical', background: 'var(--bg-main)', color: 'var(--text-main)' }}
              ></textarea>
            </div>
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading}
              style={{ padding: '12px', marginTop: '10px', cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Sending Message...' : 'Send Message'}
            </button>
          </form>
        </div>

        <div style={{ flex: '1', minWidth: '300px', backgroundColor: 'var(--bg-light)', padding: '30px', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '20px' }}>Store Information</h3>
          <div style={{ marginBottom: '15px' }}>
            <strong style={{ display: 'block', marginBottom: '5px' }}>Address</strong>
            <span style={{ color: 'var(--text-muted)', whiteSpace: 'pre-line' }}>{storeSettings?.address || '123 Auto Parts Blvd,\nMotor City, MI 48201'}</span>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <strong style={{ display: 'block', marginBottom: '5px' }}>Phone</strong>
            <span style={{ color: 'var(--text-muted)' }}>{storeSettings?.phone || '+1 (555) 123-4567'}</span>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <strong style={{ display: 'block', marginBottom: '5px' }}>Email</strong>
            <span style={{ color: 'var(--text-muted)' }}>{storeSettings?.email || 'contact@6ix7even.com'}</span>
          </div>
          <div style={{ marginTop: '30px' }}>
            <strong style={{ display: 'block', marginBottom: '5px' }}>Business Hours</strong>
            <span style={{ color: 'var(--text-muted)', whiteSpace: 'pre-line' }}>{storeSettings?.businessHours ? storeSettings.businessHours.replace(/\\n/g, '\n') : 'Monday - Friday: 8AM - 6PM\nSaturday: 9AM - 4PM'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactPage;
