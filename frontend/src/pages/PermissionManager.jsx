import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import './RoleManager.css'; // Reusing styles

const PermissionManager = () => {
  const [permissions, setPermissions] = useState([]);
  const [newPermission, setNewPermission] = useState({ name: '', description: '', group: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const data = await api.getPermissions();
      setPermissions(data);
    } catch (err) {
      setError("Failed to load permissions");
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

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this permission?")) return;
    try {
      await api.deletePermission(id);
      loadPermissions();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="admin-loading">Loading Permissions...</div>;

  return (
    <div className="role-manager-container">
      <div className="role-list-section">
        <h3>Create New Permission</h3>
        <form onSubmit={handleCreate} className="role-form">
          <div className="form-group">
            <label>Permission Name (slug format)</label>
            <input 
              type="text" 
              placeholder="e.g. parts.delete"
              value={newPermission.name}
              onChange={(e) => setNewPermission({...newPermission, name: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Group</label>
            <input 
              type="text" 
              placeholder="e.g. Parts"
              value={newPermission.group}
              onChange={(e) => setNewPermission({...newPermission, group: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea 
              placeholder="What does this permission allow?"
              value={newPermission.description}
              onChange={(e) => setNewPermission({...newPermission, description: e.target.value})}
              required
            />
          </div>
          <button type="submit" className="btn-primary">Add Permission</button>
        </form>

        <div className="roles-grid" style={{ marginTop: '30px' }}>
          <h4>Existing Permissions</h4>
          {permissions.map(perm => (
            <div key={perm.id} className="role-card">
              <div className="role-card-info">
                <strong>{perm.name}</strong>
                <span style={{ fontSize: '11px', color: 'var(--admin-text-muted)' }}>{perm.group}</span>
              </div>
              <button className="btn-delete" onClick={() => handleDelete(perm.id)}>×</button>
            </div>
          ))}
        </div>
      </div>

      <div className="permissions-section">
        <div className="empty-state">
          <h3>Permission Management</h3>
          <p>Define fine-grained access slugs here. These slugs can then be assigned to roles in the Role Manager.</p>
        </div>
      </div>
    </div>
  );
};

export default PermissionManager;
