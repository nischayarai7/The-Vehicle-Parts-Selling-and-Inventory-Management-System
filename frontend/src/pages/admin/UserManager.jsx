import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useSelector } from 'react-redux';
import ConfirmModal from '../../components/common/ConfirmModal';

const UserManager = () => {
  const { user: currentUser } = useSelector((state) => state.auth);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);
  
  // Modal state
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, userId: null, userName: '' });
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, rolesData] = await Promise.all([
        api.getUsers(),
        api.getRoles()
      ]);
      setUsers(usersData);
      setRoles(rolesData);
    } catch (error) {
      console.error("Failed to load users", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    // Find role IDs by comparing names (backend returns role names in list)
    const currentRoleIds = roles
      .filter(r => user.roles.includes(r.name))
      .map(r => r.id);
    setSelectedRoleIds(currentRoleIds);
  };

  const handleSaveRoles = async () => {
    try {
      await api.assignUserRoles(editingUser.id, selectedRoleIds);
      setEditingUser(null);
      loadData();
      setNotification({
        type: 'success',
        title: "Roles Updated Successfully",
        message: `The access permissions and authorization roles for ${editingUser.fullName} have been successfully synchronised with the database.`
      });
    } catch (error) {
      setNotification({
        type: 'error',
        title: "Role Update Failed",
        message: "Failed to update user roles. Please verify system connections and try again."
      });
    }
  };

  const toggleRole = (roleId) => {
    const role = roles.find(r => r.id === roleId);
    
    // Prevent removing Admin role from oneself
    if (editingUser.email === currentUser?.email && role?.name === 'Admin' && selectedRoleIds.includes(roleId)) {
      setNotification({
        type: 'error',
        title: "Lockout Protection Active",
        message: "Security Protocol: You cannot remove the Administrator role from your own active account to prevent administrative lockout."
      });
      return;
    }

    if (selectedRoleIds.includes(roleId)) {
      setSelectedRoleIds(selectedRoleIds.filter(id => id !== roleId));
    } else {
      setSelectedRoleIds([...selectedRoleIds, roleId]);
    }
  };

  const openDeleteConfirm = (user) => {
    if (user.email === currentUser?.email) {
      setNotification({
        type: 'error',
        title: "Self-Deletion Restricted",
        message: "For system security, you are not permitted to delete your own logged-in account."
      });
      return;
    }
    if (user.email === 'admin@6ix7even.com') {
      setNotification({
        type: 'error',
        title: "Account is Protected",
        message: "Authority Lock: The primary system administrator account cannot be deleted under any circumstances."
      });
      return;
    }
    if (user.email === 'deleted@6ix7even.com') {
      setNotification({
        type: 'error',
        title: "Account is Protected",
        message: "System Safety: The transaction placeholder account is required by database relations and cannot be deleted."
      });
      return;
    }
    setConfirmModal({ isOpen: true, userId: user.id, userName: user.fullName, userEmail: user.email });
  };

  const handleConfirmDelete = async () => {
    try {
      await api.deleteUser(confirmModal.userId);
      const purgedName = confirmModal.userName;
      const purgedEmail = confirmModal.userEmail;
      
      setConfirmModal({ isOpen: false, userId: null, userName: '', userEmail: '' });
      setNotification({
        type: 'success',
        title: "Account Permanently Purged",
        message: "The user account and access privileges have been securely removed from the system. Associated transactions have been successfully reassigned under the safety placeholder account to maintain transaction ledger integrity.",
        userName: purgedName,
        userEmail: purgedEmail
      });
      loadData();
    } catch (error) {
      setConfirmModal({ isOpen: false, userId: null, userName: '', userEmail: '' });
      setNotification({
        type: 'error',
        title: "Deletion Disallowed",
        message: error.message || "Failed to delete the user. Relational security protocols prevented this operation."
      });
    }
  };

  if (loading) return <div className="admin-loading">Loading Users...</div>;

  return (
    <div className="admin-content-inner">
      <h2 style={{ marginBottom: '20px' }}>User Access Management</h2>

      <div className="large-card">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--admin-text-muted)', fontSize: '12px', borderBottom: '1px solid var(--admin-border)' }}>
              <th style={{ padding: '15px 10px' }}>Full Name</th>
              <th>Email Address</th>
              <th>Current Roles</th>
              <th>Created At</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={{ fontSize: '14px', borderBottom: '1px solid var(--admin-border)' }}>
                <td style={{ padding: '15px 10px', fontWeight: '500' }}>{user.fullName}</td>
                <td style={{ color: 'var(--admin-text-muted)' }}>{user.email}</td>
                <td>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    {user.roles.map(r => (
                      <span key={r} style={{ 
                        background: r === 'Admin' ? 'var(--admin-accent-glow)' : '#1c2128', 
                        color: r === 'Admin' ? 'var(--admin-accent)' : 'white',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        border: `1px solid ${r === 'Admin' ? 'var(--admin-accent)' : 'var(--admin-border)'}`
                      }}>
                        {r}
                      </span>
                    ))}
                  </div>
                </td>
                <td style={{ color: 'var(--admin-text-muted)', fontSize: '12px' }}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button 
                      className="btn-primary" 
                      style={{ padding: '5px 10px', fontSize: '12px' }}
                      onClick={() => handleEditClick(user)}
                    >
                      Roles
                    </button>
                    {user.email !== currentUser?.email && user.email !== 'admin@6ix7even.com' && (
                      <button 
                        className="admin-btn-danger-outline"
                        style={{ padding: '5px 10px', fontSize: '12px', borderRadius: '4px' }}
                        onClick={() => openDeleteConfirm(user)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Role Assignment Modal (Simple Overlay) */}
      {editingUser && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', 
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 
        }}>
          <div className="large-card" style={{ width: '400px', border: '1px solid var(--admin-accent)' }}>
            <h3>Manage Roles: {editingUser.fullName}</h3>
            <p style={{ fontSize: '12px', color: 'var(--admin-text-muted)', margin: '10px 0 20px 0' }}>{editingUser.email}</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {roles.map(role => {
                const isSelfAdminRemoval = editingUser.email === currentUser?.email && role.name === 'Admin';
                
                return (
                  <div 
                    key={role.id}
                    onClick={() => !isSelfAdminRemoval && toggleRole(role.id)}
                    style={{ 
                      padding: '12px', borderRadius: '8px', border: '1px solid var(--admin-border)',
                      background: selectedRoleIds.includes(role.id) ? 'var(--admin-accent-glow)' : 'transparent',
                      display: 'flex', alignItems: 'center', gap: '10px', 
                      cursor: isSelfAdminRemoval ? 'not-allowed' : 'pointer',
                      opacity: isSelfAdminRemoval ? 0.6 : 1
                    }}
                    title={isSelfAdminRemoval ? "You cannot remove your own Admin role" : ""}
                  >
                     <input 
                       type="checkbox" 
                       checked={selectedRoleIds.includes(role.id)} 
                       disabled={isSelfAdminRemoval}
                       readOnly 
                     />
                     <span>{role.name}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={handleSaveRoles}>Save Changes</button>
              <button className="admin-btn-outline" style={{ flex: 1, borderRadius: '8px' }} onClick={() => setEditingUser(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title="Delete User"
        message={`Are you sure you want to delete the user "${confirmModal.userName}"? This will permanently remove their access to the system.`}
        confirmText="Delete User"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmModal({ isOpen: false, userId: null, userName: '', userEmail: '' })}
      />

      {/* Success/Error Modal Overlay */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(10, 12, 16, 0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }} onClick={() => setNotification(null)}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(28, 33, 40, 0.95), rgba(34, 41, 50, 0.95))',
            border: `1px solid ${notification.type === 'success' ? 'rgba(74, 222, 128, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
            boxShadow: `0 20px 40px rgba(0, 0, 0, 0.4), 0 0 100px ${notification.type === 'success' ? 'rgba(74, 222, 128, 0.05)' : 'rgba(239, 68, 68, 0.05)'}`,
            borderRadius: '16px',
            padding: '40px',
            width: '450px',
            maxWidth: '90%',
            textAlign: 'center',
            color: '#f0f6fc',
            boxSizing: 'border-box'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: notification.type === 'success' ? 'rgba(74, 222, 128, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              border: `2px solid ${notification.type === 'success' ? 'rgb(74, 222, 128)' : 'rgb(239, 68, 68)'}`,
              color: notification.type === 'success' ? 'rgb(74, 222, 128)' : 'rgb(239, 68, 68)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px auto',
              boxShadow: `0 0 20px ${notification.type === 'success' ? 'rgba(74, 222, 128, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`
            }}>
              {notification.type === 'success' ? (
                <svg style={{ width: '30px', height: '30px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              ) : (
                <svg style={{ width: '30px', height: '30px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              )}
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '12px', letterSpacing: '-0.5px' }}>{notification.title}</h2>
            <p style={{ fontSize: '14px', color: '#8b949e', lineHeight: '1.6', marginBottom: '24px', marginStart: 0, marginEnd: 0 }}>{notification.message}</p>
            
            {notification.userName && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '24px',
                textAlign: 'left',
                boxSizing: 'border-box'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
                  <span style={{ color: '#8b949e' }}>Account:</span>
                  <span style={{ color: notification.type === 'success' ? 'rgb(74, 222, 128)' : 'rgb(239, 68, 68)', fontWeight: '600' }}>
                    {notification.type === 'success' ? 'Purged Safely' : 'Action Blocked'}
                  </span>
                </div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#f0f6fc' }}>{notification.userName}</div>
                {notification.userEmail && <div style={{ fontSize: '12px', color: '#8b949e', marginTop: '4px' }}>{notification.userEmail}</div>}
              </div>
            )}
            
            <button 
              style={{
                width: '100%',
                padding: '12px 24px',
                background: notification.type === 'success' ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: `0 4px 12px ${notification.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                boxSizing: 'border-box'
              }}
              onClick={() => setNotification(null)}
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManager;
