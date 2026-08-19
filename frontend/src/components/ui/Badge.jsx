import React from 'react';

const mapClass = (level) => {
  const v = String(level || '').toLowerCase();
  if (v.includes('crit')) return 'badge badge-critical';
  if (v === 'alto' || v === 'high') return 'badge badge-high';
  if (v === 'medio' || v === 'medium') return 'badge badge-medium';
  return 'badge badge-low';
};

const Badge = ({ level }) => {
  return <span className={mapClass(level)}>{String(level || 'bajo')}</span>;
};

export default Badge;
