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

  useEffect(() => {
    if (user) {
      setProfileData({
        fullName: user.fullName || '',
        avatarUrl: user.avatarUrl || ''
      });
    }
  }, [user]);

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
            👤 General Profile
          </button>
          <button 
            className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            🔐 Password & Security
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
          ) : (
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
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
