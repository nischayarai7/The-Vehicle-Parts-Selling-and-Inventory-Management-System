import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { api } from '../services/api';
import { updateUser } from '../store/slices/authSlice';
import PasswordStrengthMeter from '../components/common/PasswordStrengthMeter';
import './ProfileSettings.css';

const ProfileSettings = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({ fullName: '', avatarUrl: '' });
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [myOrders, setMyOrders] = useState([]);

  useEffect(() => {
    if (user) {
      setProfileData({
        fullName: user.fullName || '',
        avatarUrl: user.avatarUrl || ''
      });
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'orders') {
      fetchMyOrders();
    }
  }, [activeTab]);

  const fetchMyOrders = async () => {
    setLoading(true);
    try {
      const data = await api.getCustomerOrders();
      setMyOrders(data);
    } catch (err) {
      showMessage('error', 'Failed to load your purchase orders');
    } finally {
      setLoading(false);
    }
  };



  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => {
      setMessage({ type: '', text: '' });
    }, 5000);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.updateProfile(profileData);
      dispatch(updateUser(response));
      showMessage('success', 'Profile updated successfully!');
    } catch (err) {
      showMessage('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage('error', 'New passwords do not match');
      return;
    }
    
    setLoading(true);
    try {
      await api.changePassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword
      });
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      showMessage('success', 'Password changed successfully!');
    } catch (err) {
      showMessage('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const response = await api.uploadAvatar(selectedFile);
      setProfileData({ ...profileData, avatarUrl: response.url });
      setSelectedFile(null);
      setPreviewUrl(null);
      showMessage('success', 'Avatar uploaded! Save profile to finalize.');
    } catch (err) {
      showMessage('error', 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleCancelUpload = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  return (
    <div className="settings-container">
      <div className="settings-card">
        <div className="settings-header">
          <h2>Account Settings</h2>
          <p>Manage your profile information and security preferences.</p>
        </div>

        <div className="settings-tabs">
          <button 
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> General Profile
          </button>
          <button 
            className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Password & Security
          </button>
          <button 
            className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> My Purchase Orders
          </button>
        </div>

        {message.text && (
          <div className={`settings-message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="settings-content">
          {activeTab === 'profile' ? (
            <form onSubmit={handleProfileUpdate} className="settings-form">
              <div className="avatar-section">
                <div className="avatar-preview">
                  {previewUrl || profileData.avatarUrl ? (
                    <img src={previewUrl || profileData.avatarUrl} alt="Avatar" />
                  ) : (
                    <div className="avatar-placeholder">
                      {profileData.fullName.charAt(0)}
                    </div>
                  )}
                  {uploading && <div className="avatar-loader">...</div>}
                </div>
                <div className="avatar-actions">
                  {selectedFile ? (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button type="button" className="btn-primary" onClick={handleConfirmUpload} disabled={uploading}>
                        {uploading ? 'Uploading...' : 'Confirm'}
                      </button>
                      <button type="button" className="btn-secondary" onClick={handleCancelUpload} disabled={uploading}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <label className="btn-secondary">
                        Change Photo
                        <input type="file" hidden onChange={handleFileChange} accept="image/*" />
                      </label>
                      <p>JPG, PNG or GIF. Max 5MB.</p>
                    </>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  value={profileData.fullName}
                  onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input type="email" value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
                <span className="input-hint">Email cannot be changed.</span>
              </div>

              {selectedFile && (
                <div className="settings-message warning" style={{ marginBottom: '15px' }}>
                  Please confirm or cancel your avatar upload before saving changes.
                </div>
              )}

              <button 
                type="submit" 
                className="btn-primary" 
                disabled={
                  loading || 
                  selectedFile !== null || 
                  (profileData.fullName === (user?.fullName || '') && profileData.avatarUrl === (user?.avatarUrl || ''))
                }
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          ) : activeTab === 'security' ? (
            <form onSubmit={handlePasswordChange} className="settings-form">
              <div className="form-group">
                <label>Current Password</label>
                <input 
                  type="password" 
                  value={passwordData.oldPassword}
                  onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>New Password</label>
                <input 
                  type="password" 
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  required
                />
                <PasswordStrengthMeter password={passwordData.newPassword} />
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
                <input 
                  type="password" 
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  required
                />
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          ) : (
            <div className="orders-container">
              <div className="garage-header" style={{ marginBottom: '20px' }}>
                <h3>My Purchase Orders ({myOrders.length})</h3>
              </div>

              {loading ? (
                <p style={{ color: '#888' }}>Refreshing orders log...</p>
              ) : myOrders.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {myOrders.map(order => (
                    <div key={order.id} style={{ background: '#181818', border: '1px solid #222', borderRadius: '8px', padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px', marginBottom: '15px' }}>
                        <div>
                          <span style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase', display: 'block', letterSpacing: '0.5px' }}>Order Reference</span>
                          <strong style={{ color: '#fff', fontSize: '1.05rem' }}>{order.orderNumber}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase', display: 'block', letterSpacing: '0.5px' }}>Ordered On</span>
                          <span style={{ color: '#aaa', fontSize: '0.9rem' }}>{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase', display: 'block', letterSpacing: '0.5px' }}>Delivery Status</span>
                          <span style={{ 
                            padding: '4px 10px', 
                            borderRadius: '4px', 
                            fontSize: '11px', 
                            fontWeight: 'bold',
                            background: order.status === 'Completed' ? 'rgba(46,160,67,0.1)' : 'rgba(227,179,59,0.1)',
                            color: order.status === 'Completed' ? '#3fb950' : '#e3b33b',
                            border: order.status === 'Completed' ? '1px solid #2ea043' : '1px solid #d4a727'
                          }}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                      <div style={{ borderTop: '1px dashed #282828', borderBottom: '1px dashed #282828', padding: '12px 0', margin: '12px 0' }}>
                        <span style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase', display: 'block', marginBottom: '6px', letterSpacing: '0.5px' }}>Delivery Address</span>
                        <p style={{ margin: 0, color: '#aaa', fontSize: '0.9rem' }}>{order.shippingAddress}</p>
                        {order.notes && (
                          <div style={{ marginTop: '10px' }}>
                            <span style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase', display: 'block', marginBottom: '4px', letterSpacing: '0.5px' }}>Special Instructions</span>
                            <p style={{ margin: 0, color: '#888', fontSize: '0.85rem', fontStyle: 'italic' }}>{order.notes}</p>
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', color: '#888' }}>
                          <span>Payment Method: <strong style={{ color: '#fff' }}>{order.paymentMethod || 'Cash on Delivery'}</strong></span>
                          <span>Subtotal: Rs. {(order.originalAmount > 0 ? order.originalAmount : order.totalAmount).toFixed(2)}</span>
                        </div>
                        {order.discountAmount > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', fontSize: '0.9rem', color: '#3fb950' }}>
                            <span>Loyalty Discount Applied:</span>
                            <strong>-Rs. {order.discountAmount.toFixed(2)}</strong>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', alignItems: 'center', borderTop: '1px solid #222', paddingTop: '8px', marginTop: '4px' }}>
                          <span style={{ color: '#fff', fontSize: '0.95rem', fontWeight: '500' }}>Grand Total Paid:</span>
                          <strong style={{ color: 'var(--primary)', fontSize: '1.2rem', fontWeight: '700' }}>
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'NPR',
                              minimumFractionDigits: 2
                            }).format(order.totalAmount).replace('NPR', 'Rs.')}
                          </strong>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#888' }}>You haven't placed any storefront orders yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
