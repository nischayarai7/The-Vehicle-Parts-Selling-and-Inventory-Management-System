import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import ConfirmModal from '../../components/common/ConfirmModal';

const RoleManager = () => {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newRole, setNewRole] = useState({ name: '', description: '' });
  
  // Modal state
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, roleId: null, roleName: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rolesData, permsData] = await Promise.all([
        api.getRoles(),
        api.getPermissions()
      ]);
      setRoles(rolesData);
      setPermissions(permsData);
    } catch (error) {
      console.error("Failed to load roles", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    try {
      await api.createRole(newRole);
      setNewRole({ name: '', description: '' });
      loadData();
    } catch (error) {
      alert("Failed to create role");
    }
  };

  const openDeleteConfirm = (e, id, name) => {
    e.stopPropagation();
    if (name === 'Admin' || name === 'Customer') {
      alert("System roles cannot be deleted");
      return;
    }
    setConfirmModal({ isOpen: true, roleId: id, roleName: name });
  };

  const handleConfirmDelete = async () => {
    try {
      await api.deleteRole(confirmModal.roleId);
      if (selectedRole?.id === confirmModal.roleId) setSelectedRole(null);
      setConfirmModal({ isOpen: false, roleId: null, roleName: '' });
      loadData();
    } catch (error) {
      alert(error.message || "Failed to delete role");
      setConfirmModal({ isOpen: false, roleId: null, roleName: '' });
    }
  };

  const handlePermissionToggle = async (roleId, permId, isAssigned) => {
    const role = roles.find(r => r.id === roleId);
    let newPermIds = role.rolePermissions.map(rp => rp.permissionId);
    
    if (isAssigned) {
      newPermIds = newPermIds.filter(id => id !== permId);
    } else {
      newPermIds.push(permId);
    }

    try {
      await api.assignPermissions(roleId, newPermIds);
      loadData(); // Refresh to show changes
    } catch (error) {
      alert("Failed to update permissions");
    }
  };

  if (loading) return <div className="admin-loading">Loading RBAC...</div>;

  return (
    <div className="admin-content-inner">
      <h2 style={{ marginBottom: '20px' }}>Role & Permission Management</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '30px' }}>
        
        {/* Left: Create & List Roles */}
        <div>
          <div className="large-card" style={{ marginBottom: '20px' }}>
            <h4>Create New Role</h4>
            <form onSubmit={handleCreateRole} style={{ marginTop: '15px' }}>
              <input 
                type="text" 
                placeholder="Role Name" 
                value={newRole.name}
                onChange={e => setNewRole({...newRole, name: e.target.value})}
                style={{ width: '100%', padding: '10px', background: '#1c2128', border: '1px solid var(--admin-border)', color: 'white', borderRadius: '4px', marginBottom: '10px' }}
                required
              />
              <textarea 
                placeholder="Description" 
                value={newRole.description}
                onChange={e => setNewRole({...newRole, description: e.target.value})}
                style={{ width: '100%', padding: '10px', background: '#1c2128', border: '1px solid var(--admin-border)', color: 'white', borderRadius: '4px', marginBottom: '10px', height: '60px' }}
              />
              <button className="btn-primary" type="submit" style={{ width: '100%' }}>Create Role</button>
            </form>
          </div>

          <div className="large-card">
            <h4>Existing Roles</h4>
            <div style={{ marginTop: '15px' }}>
              {roles.map(role => (
                <div 
                  key={role.id} 
                  onClick={() => setSelectedRole(role)}
                  style={{ 
                    padding: '12px', 
                    borderRadius: '8px', 
                    background: selectedRole?.id === role.id ? 'var(--admin-accent-glow)' : 'transparent',
                    border: `1px solid ${selectedRole?.id === role.id ? 'var(--admin-accent)' : 'var(--admin-border)'}`,
                    marginBottom: '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 'bold', color: selectedRole?.id === role.id ? 'var(--admin-accent)' : 'white' }}>{role.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--admin-text-muted)' }}>{role.description}</div>
                  </div>
                  {(role.name !== 'Admin' && role.name !== 'Customer') && (
                    <button 
                      className="btn-delete-small"
                      onClick={(e) => openDeleteConfirm(e, role.id, role.name)}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '18px', padding: '0 5px' }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Permission Toggles */}
        <div className="large-card">
          {selectedRole ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4>Manage Permissions: <span style={{ color: 'var(--admin-accent)' }}>{selectedRole.name}</span></h4>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                {permissions.map(perm => {
                  const isAssigned = selectedRole.rolePermissions.some(rp => rp.permissionId === perm.id);
                  return (
                    <div 
                      key={perm.id} 
                      onClick={() => handlePermissionToggle(selectedRole.id, perm.id, isAssigned)}
                      style={{ 
                        padding: '12px', 
                        borderRadius: '8px', 
                        background: isAssigned ? '#1c2128' : 'transparent',
                        border: '1px solid var(--admin-border)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ 
                        width: '18px', 
                        height: '18px', 
                        border: '2px solid var(--admin-accent)', 
                        borderRadius: '4px',
                        background: isAssigned ? 'var(--admin-accent)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px'
                      }}>
                        {isAssigned && '✓'}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '500' }}>{perm.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>{perm.description}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-text-muted)' }}>
              Select a role from the left to manage permissions
            </div>
          )}
        </div>

      </div>

      {/* Confirmation Modal */}
      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title="Delete Role"
        message={`Are you sure you want to delete the role "${confirmModal.roleName}"? This action cannot be undone.`}
        confirmText="Delete Role"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmModal({ isOpen: false, roleId: null, roleName: '' })}
      />
    </div>
  );
};

export default RoleManager;
