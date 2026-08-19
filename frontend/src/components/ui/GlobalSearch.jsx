import React, { useState, useEffect } from 'react';

const GlobalSearch = ({ onSearch }) => {
  const [q, setQ] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      if (onSearch) onSearch(q.trim());
    }, 360);
    return () => clearTimeout(t);
  }, [q, onSearch]);

  return (
    <div className="global-search">
      <input
        placeholder="Buscar globalmente... (estudiante, alerta, cita)"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
    </div>
  );
};

export default GlobalSearch;
