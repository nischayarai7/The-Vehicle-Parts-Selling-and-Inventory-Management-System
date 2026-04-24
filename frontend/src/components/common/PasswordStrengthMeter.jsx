import React from 'react';

const PasswordStrengthMeter = ({ password }) => {
  const getStrength = (pass) => {
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (/[A-Z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    if (/[^A-Za-z0-9]/.test(pass)) strength++;
    return strength;
  };

  const strength = getStrength(password);
  
  const getColor = () => {
    if (password.length === 0) return '#30363d';
    if (strength <= 1) return '#ea4444'; // Weak
    if (strength <= 2) return '#f39c12'; // Medium
    if (strength <= 3) return '#2ecc71'; // Strong
    return '#2ecc71';
  };

  const getLabel = () => {
    if (password.length === 0) return '';
    if (strength <= 1) return 'Weak';
    if (strength <= 2) return 'Medium';
    if (strength >= 3) return 'Strong';
    return '';
  };

  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ display: 'flex', gap: '4px', height: '4px', marginBottom: '6px' }}>
        {[1, 2, 3, 4].map((i) => (
          <div 
            key={i}
            style={{ 
              flex: 1, 
              background: i <= strength ? getColor() : '#30363d',
              borderRadius: '2px',
              transition: 'all 0.3s'
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: '11px', color: getColor(), fontWeight: '600' }}>
        {getLabel()}
      </span>
    </div>
  );
};

export default PasswordStrengthMeter;
