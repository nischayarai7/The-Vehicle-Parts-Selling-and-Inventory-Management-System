import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';

const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);

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
    } catch (error) {
      alert("Failed to update user roles");
    }
  };

  const toggleRole = (roleId) => {
    if (selectedRoleIds.includes(roleId)) {
      setSelectedRoleIds(selectedRoleIds.filter(id => id !== roleId));
    } else {
      setSelectedRoleIds([...selectedRoleIds, roleId]);
    }
  };

  if (loading) return <div>Loading...</div>;

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
                  <button 
                    className="btn-primary" 
                    style={{ padding: '5px 10px', fontSize: '12px' }}
                    onClick={() => handleEditClick(user)}
                  >
                    Assign Roles
                  </button>
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
              {roles.map(role => (
                <div 
                  key={role.id}
                  onClick={() => toggleRole(role.id)}
                  style={{ 
                    padding: '12px', borderRadius: '8px', border: '1px solid var(--admin-border)',
                    background: selectedRoleIds.includes(role.id) ? 'var(--admin-accent-glow)' : 'transparent',
                    display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer'
                  }}
                >
                   <input type="checkbox" checked={selectedRoleIds.includes(role.id)} readOnly />
                   <span>{role.name}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn-primary" style={{ flex: 1 }} onClick={handleSaveRoles}>Save Changes</button>
              <button style={{ flex: 1, background: 'transparent', border: '1px solid var(--admin-border)', color: 'white', borderRadius: '8px' }} onClick={() => setEditingUser(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManager;
