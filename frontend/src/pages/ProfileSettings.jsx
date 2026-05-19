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
  const [profileData, setProfileData] = useState({ fullName: '', avatarUrl: '', phoneNumber: '', address: '' });
  const [initialProfileData, setInitialProfileData] = useState({ fullName: '', avatarUrl: '', phoneNumber: '', address: '' });
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [phoneError, setPhoneError] = useState('');

  // System wallpaper management (Admin only)
  const [wallpaperUrl, setWallpaperUrl] = useState(null);
  const [selectedWallpaper, setSelectedWallpaper] = useState(null);
  const [wallpaperPreview, setWallpaperPreview] = useState(null);
  const [wallpaperLoading, setWallpaperLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'Admin') {
      fetchWallpaperSetting();
    }
  }, [user]);

  const fetchWallpaperSetting = async () => {
    try {
      const res = await api.getWallpaper();
      if (res && res.url) {
        setWallpaperUrl(res.url);
      } else {
        setWallpaperUrl(null);
      }
    } catch (err) {
      console.error('Failed to fetch wallpaper setting:', err);
    }
  };

  const handleWallpaperFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedWallpaper(file);
    setWallpaperPreview(URL.createObjectURL(file));
  };

  const handleWallpaperUploadConfirm = async () => {
    if (!selectedWallpaper) return;
    setWallpaperLoading(true);
    try {
      const res = await api.uploadWallpaper(selectedWallpaper);
      setWallpaperUrl(res.url);
      setSelectedWallpaper(null);
      setWallpaperPreview(null);
      showMessage('success', 'System wallpaper uploaded and applied successfully!');
    } catch (err) {
      showMessage('error', err.message || 'Failed to upload system wallpaper');
    } finally {
      setWallpaperLoading(false);
    }
  };

  const handleWallpaperCancel = () => {
    setSelectedWallpaper(null);
    setWallpaperPreview(null);
  };

  const handleWallpaperDelete = async () => {
    if (!window.confirm('Are you sure you want to delete the custom system wallpaper? This will revert the background to the default theme.')) {
      return;
    }
    setWallpaperLoading(true);
    try {
      await api.deleteWallpaper();
      setWallpaperUrl(null);
      setSelectedWallpaper(null);
      setWallpaperPreview(null);
      showMessage('success', 'System wallpaper deleted. Reverted to default theme.');
    } catch (err) {
      showMessage('error', err.message || 'Failed to delete system wallpaper');
    } finally {
      setWallpaperLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      // Load saved profile from API to get latest phone/address
      api.getProfile().then((data) => {
        const loaded = {
          fullName: data.fullName || user.fullName || '',
          avatarUrl: data.avatarUrl || user.avatarUrl || '',
          phoneNumber: data.phoneNumber || user.phoneNumber || '',
          address: data.address || user.address || ''
        };
        setProfileData(loaded);
        setInitialProfileData(loaded);
      }).catch(() => {
        const loaded = {
          fullName: user.fullName || '',
          avatarUrl: user.avatarUrl || '',
          phoneNumber: user.phoneNumber || '',
          address: user.address || ''
        };
        setProfileData(loaded);
        setInitialProfileData(loaded);
      });
    }
  }, [user]);



  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => {
      setMessage({ type: '', text: '' });
    }, 5000);
  };

  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setProfileData({ ...profileData, phoneNumber: val });
    if (val.length > 0 && val.length < 10) {
      setPhoneError('Phone number must be exactly 10 digits.');
    } else {
      setPhoneError('');
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    const isCustomer = user?.role === 'Customer';
    if (isCustomer) {
      if (!profileData.phoneNumber || profileData.phoneNumber.replace(/\D/g, '').length !== 10) {
        showMessage('error', 'Phone number is required and must be exactly 10 digits.');
        return;
      }
      if (!profileData.address || !profileData.address.trim()) {
        showMessage('error', 'Delivery location is required.');
        return;
      }
    } else {
      if (profileData.phoneNumber && profileData.phoneNumber.replace(/\D/g, '').length !== 10) {
        showMessage('error', 'Phone number must be exactly 10 digits if provided.');
        return;
      }
    }
    setLoading(true);
    try {
      let finalAvatarUrl = profileData.avatarUrl;
      if (selectedFile) {
        setUploading(true);
        const uploadRes = await api.uploadAvatar(selectedFile);
        finalAvatarUrl = uploadRes.url;
        setSelectedFile(null);
        setPreviewUrl(null);
        setUploading(false);
      }
      const response = await api.updateProfile({
        fullName: profileData.fullName,
        avatarUrl: finalAvatarUrl,
        phoneNumber: profileData.phoneNumber || null,
        address: profileData.address || null
      });
      // Update localStorage so checkout can auto-fill address immediately
      const currentUser = api.getUser();
      if (currentUser) {
        localStorage.setItem('user', JSON.stringify({
          ...currentUser,
          phoneNumber: response.phoneNumber || profileData.phoneNumber || null,
          address: response.address || profileData.address || null
        }));
      }
      dispatch(updateUser(response));

      const savedData = {
        fullName: response.fullName || profileData.fullName,
        avatarUrl: response.avatarUrl || finalAvatarUrl,
        phoneNumber: response.phoneNumber || profileData.phoneNumber || '',
        address: response.address || profileData.address || ''
      };
      setProfileData(savedData);
      setInitialProfileData(savedData);
      setSelectedFile(null);
      setPreviewUrl(null);

      showMessage('success', 'Profile updated successfully!');
    } catch (err) {
      showMessage('error', err.message || 'Failed to save changes');
      setUploading(false);
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

  const hasProfileChanges = 
    profileData.fullName !== initialProfileData.fullName ||
    profileData.phoneNumber !== initialProfileData.phoneNumber ||
    profileData.address !== initialProfileData.address ||
    profileData.avatarUrl !== initialProfileData.avatarUrl ||
    selectedFile !== null;

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
          {user?.role === 'Admin' && (
            <button 
              className={`tab-btn ${activeTab === 'wallpaper' ? 'active' : ''}`}
              onClick={() => setActiveTab('wallpaper')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> System Wallpaper
            </button>
          )}
        </div>

        {message.text && (
          <div className={`settings-message ${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="settings-content">
          {activeTab === 'profile' && (
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

              {/* Phone + Address in a compact 2-col grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 15.1 19.79 19.79 0 0 1 1.61 6.53 2 2 0 0 1 3.59 4h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 11.61a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.5 19v-.08z"/></svg>
                    Phone Number {user?.role === 'Customer' && <span style={{ color: '#ff4d4f', marginLeft: '2px' }}>*</span>}
                  </label>
                  <div className="phone-input-wrapper">
                    <span className="phone-prefix">+977</span>
                    <input
                      type="tel"
                      placeholder="98XXXXXXXX"
                      value={profileData.phoneNumber}
                      onChange={handlePhoneChange}
                      maxLength={10}
                      required={user?.role === 'Customer'}
                    />
                  </div>
                  {phoneError
                    ? <span className="input-hint" style={{ color: '#ff4d4f', marginTop: '4px', display: 'block' }}>{phoneError}</span>
                    : <span className="input-hint" style={{ marginTop: '4px', display: 'block' }}>10-digit Nepal number, e.g. 9812345678</span>
                  }
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                    Delivery Location {user?.role === 'Customer' && <span style={{ color: '#ff4d4f', marginLeft: '2px' }}>*</span>}
                  </label>
                  <input
                    type="text"
                    placeholder="Street, City, Landmark..."
                    value={profileData.address}
                    onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                    required={user?.role === 'Customer'}
                  />
                  <span className="input-hint" style={{ marginTop: '4px', display: 'block' }}>Auto-fills your checkout address</span>
                </div>
              </div>

              {selectedFile && (
                <div className="settings-message warning" style={{ marginBottom: '15px', background: 'rgba(250, 173, 20, 0.1)', color: '#faad14', border: '1px solid rgba(250, 173, 20, 0.2)' }}>
                  Save Changes will automatically upload and apply your new avatar.
                </div>
              )}

              <button 
                type="submit" 
                className="btn-primary" 
                disabled={loading || uploading || !hasProfileChanges}
              >
                {loading || uploading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          )}

          {activeTab === 'security' && (
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
          )}

          {activeTab === 'wallpaper' && user?.role === 'Admin' && (
            <div className="settings-form">
              <div className="wallpaper-settings-section">
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>System Wallpaper Management</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>Upload a high-resolution image to serve as the homepage background for all users across the system.</p>

                <div className="wallpaper-preview-container" style={{ margin: '20px 0', border: '2px dashed var(--border-color)', borderRadius: '12px', padding: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '260px', background: 'rgba(0, 0, 0, 0.02)', position: 'relative', overflow: 'hidden' }}>
                  {wallpaperPreview || wallpaperUrl ? (
                    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                      <img src={wallpaperPreview || wallpaperUrl} alt="System Wallpaper Preview" style={{ width: '100%', maxHeight: '320px', objectFit: 'cover', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                      <div style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(46, 204, 113, 0.9)', color: 'white', padding: '6px 12px', borderRadius: '50px', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Wallpaper</div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '12px', opacity: 0.5 }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                      <p style={{ fontSize: '0.95rem', fontWeight: '600' }}>Default System Theme Wallpaper Active</p>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', justifyContent: 'space-between', marginTop: '24px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <label className="btn-secondary" style={{ cursor: 'pointer', display: 'inline-block', position: 'relative' }}>
                      Select Image
                      <input type="file" hidden onChange={handleWallpaperFileChange} accept="image/*" />
                    </label>
                    
                    {selectedWallpaper && (
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                          type="button" 
                          className="btn-primary" 
                          onClick={handleWallpaperUploadConfirm} 
                          disabled={wallpaperLoading}
                        >
                          {wallpaperLoading ? 'Uploading...' : 'Confirm Upload'}
                        </button>
                        <button 
                          type="button" 
                          className="btn-secondary" 
                          onClick={handleWallpaperCancel} 
                          disabled={wallpaperLoading}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  {(wallpaperUrl || wallpaperPreview) && (
                    <button 
                      type="button" 
                      onClick={handleWallpaperDelete}
                      disabled={wallpaperLoading}
                      style={{
                        backgroundColor: '#e74c3c',
                        color: 'white',
                        padding: '10px 20px',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 12px rgba(231, 76, 60, 0.2)'
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                      Delete Wallpaper
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
