import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import ConfirmModal from '../../components/common/ConfirmModal';

const PermissionManager = () => {
  const [permissions, setPermissions] = useState([]);
  const [newPermission, setNewPermission] = useState({ name: '', description: '', group: '' });
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, permId: null, permName: '' });

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const data = await api.getPermissions();
      setPermissions(data);
    } catch (err) {
      console.error("Failed to load permissions", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.createPermission(newPermission);
      setNewPermission({ name: '', description: '', group: '' });
      loadPermissions();
    } catch (err) {
      alert(err.message);
    }
  };

  const openDeleteConfirm = (id, name) => {
    setConfirmModal({ isOpen: true, permId: id, permName: name });
  };

  const handleConfirmDelete = async () => {
    try {
      await api.deletePermission(confirmModal.permId);
      setConfirmModal({ isOpen: false, permId: null, permName: '' });
      loadPermissions();
    } catch (err) {
      alert(err.message);
      setConfirmModal({ isOpen: false, permId: null, permName: '' });
    }
  };

  if (loading) return <div className="admin-loading">Loading Permissions...</div>;

  return (
    <div className="admin-content-inner">
      <h2 style={{ marginBottom: '20px' }}>Permission Management</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '30px' }}>
        
        {/* Left: Create Permission */}
        <div>
          <div className="large-card" style={{ marginBottom: '20px' }}>
            <h4>Create New Permission</h4>
            <form onSubmit={handleCreate} style={{ marginTop: '15px' }}>
              <input 
                type="text" 
                placeholder="Name (e.g. parts.delete)" 
                value={newPermission.name}
                onChange={e => setNewPermission({...newPermission, name: e.target.value})}
                style={{ width: '100%', padding: '10px', background: '#1c2128', border: '1px solid var(--admin-border)', color: 'white', borderRadius: '4px', marginBottom: '10px' }}
                required
              />
              <input 
                type="text" 
                placeholder="Group (e.g. Parts)" 
                value={newPermission.group}
                onChange={e => setNewPermission({...newPermission, group: e.target.value})}
                style={{ width: '100%', padding: '10px', background: '#1c2128', border: '1px solid var(--admin-border)', color: 'white', borderRadius: '4px', marginBottom: '10px' }}
                required
              />
              <textarea 
                placeholder="Description" 
                value={newPermission.description}
                onChange={e => setNewPermission({...newPermission, description: e.target.value})}
                style={{ width: '100%', padding: '10px', background: '#1c2128', border: '1px solid var(--admin-border)', color: 'white', borderRadius: '4px', marginBottom: '10px', height: '60px' }}
                required
              />
              <button className="btn-primary" type="submit" style={{ width: '100%' }}>Add Permission</button>
            </form>
          </div>
        </div>

        {/* Right: Permission List */}
        <div className="large-card">
          <h4>Existing Permissions</h4>
          <div style={{ marginTop: '15px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            {permissions.map(perm => (
              <div 
                key={perm.id} 
                style={{ 
                  padding: '12px', 
                  borderRadius: '8px', 
                  background: '#1c2128',
                  border: '1px solid var(--admin-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 'bold' }}>{perm.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>{perm.group}</div>
                </div>
                <button 
                  onClick={() => openDeleteConfirm(perm.id, perm.name)}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '18px' }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Confirmation Modal */}
      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title="Delete Permission"
        message={`Are you sure you want to delete the permission "${confirmModal.permName}"? This action may affect roles using this permission.`}
        confirmText="Delete Permission"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmModal({ isOpen: false, permId: null, permName: '' })}
      />
    </div>
  );
};

export default PermissionManager;
