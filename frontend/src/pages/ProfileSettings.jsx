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

  // Vehicle states
  const [myVehicles, setMyVehicles] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);
  const [newVehicle, setNewVehicle] = useState({ vehicleId: '', licensePlate: '', vin: '', color: '' });
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        fullName: user.fullName || '',
        avatarUrl: user.avatarUrl || ''
      });
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'vehicles') {
      fetchMyVehicles();
      fetchAvailableVehicles();
    }
  }, [activeTab]);

  const fetchMyVehicles = async () => {
    try {
      const data = await api.getMyVehicles();
      setMyVehicles(data);
    } catch (err) {
      showMessage('error', 'Failed to load your vehicles');
    }
  };

  const fetchAvailableVehicles = async () => {
    try {
      const data = await api.getVehicles();
      setAvailableVehicles(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.addMyVehicle(newVehicle);
      showMessage('success', 'Vehicle added successfully!');
      setNewVehicle({ vehicleId: '', licensePlate: '', vin: '', color: '' });
      setShowAddForm(false);
      fetchMyVehicles();
    } catch (err) {
      showMessage('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVehicle = async (id) => {
    if (!window.confirm('Are you sure you want to remove this vehicle?')) return;
    try {
      await api.deleteMyVehicle(id);
      showMessage('success', 'Vehicle removed!');
      fetchMyVehicles();
    } catch (err) {
      showMessage('error', err.message);
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
            className={`tab-btn ${activeTab === 'vehicles' ? 'active' : ''}`}
            onClick={() => setActiveTab('vehicles')}
          >
            🚗 My Vehicles
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
            <div className="settings-form">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0 }}>My Garage</h3>
                {!showAddForm && (
                  <button onClick={() => setShowAddForm(true)} className="btn-primary" style={{ padding: '8px 15px', fontSize: '14px' }}>
                    + Add Vehicle
                  </button>
                )}
              </div>

              {showAddForm && (
                <form onSubmit={handleAddVehicle} style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                  <h4>Add New Vehicle</h4>
                  <div className="form-group">
                    <label>Select Vehicle Model</label>
                    <select 
                      value={newVehicle.vehicleId} 
                      onChange={e => setNewVehicle({...newVehicle, vehicleId: e.target.value})}
                      required
                      style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                    >
                      <option value="">-- Choose a vehicle --</option>
                      {availableVehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.displayName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>License Plate (Optional)</label>
                    <input 
                      type="text" 
                      value={newVehicle.licensePlate} 
                      onChange={e => setNewVehicle({...newVehicle, licensePlate: e.target.value})}
                      placeholder="e.g. ABC-1234"
                    />
                  </div>
                  <div className="form-group">
                    <label>Color (Optional)</label>
                    <input 
                      type="text" 
                      value={newVehicle.color} 
                      onChange={e => setNewVehicle({...newVehicle, color: e.target.value})}
                      placeholder="e.g. Red"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" className="btn-primary" disabled={loading}>
                      {loading ? 'Adding...' : 'Add to Garage'}
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => setShowAddForm(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {myVehicles.length > 0 ? (
                <div style={{ display: 'grid', gap: '15px' }}>
                  {myVehicles.map(v => (
                    <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', border: '1px solid #eee', borderRadius: '8px' }}>
                      <div>
                        <h4 style={{ margin: '0 0 5px 0' }}>{v.displayName}</h4>
                        <div style={{ fontSize: '14px', color: '#666', display: 'flex', gap: '15px' }}>
                          {v.licensePlate && <span><strong>Plate:</strong> {v.licensePlate}</span>}
                          {v.color && <span><strong>Color:</strong> {v.color}</span>}
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteVehicle(v.id)}
                        style={{ background: 'none', border: 'none', color: '#ff4d4f', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                !showAddForm && <p style={{ color: '#666', textAlign: 'center', padding: '20px 0' }}>No vehicles in your garage yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
