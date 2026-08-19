import React, { useState } from 'react';

const FiltersPanel = ({ onChange }) => {
  const [filters, setFilters] = useState({ riesgo: '', programa: '', semestre: '' });

  const update = (k, v) => {
    const next = { ...filters, [k]: v };
    setFilters(next);
    if (onChange) onChange(next);
  };

  return (
    <div className="filters-panel">
      <label>
        Riesgo
        <select value={filters.riesgo} onChange={(e) => update('riesgo', e.target.value)}>
          <option value="">Todos</option>
          <option value="bajo">Bajo</option>
          <option value="medio">Medio</option>
          <option value="alto">Alto</option>
          <option value="critico">Crítico</option>
        </select>
      </label>

      <label>
        Programa
        <input placeholder="Programa" value={filters.programa} onChange={(e) => update('programa', e.target.value)} />
      </label>

      <label>
        Semestre
        <input placeholder="Semestre" value={filters.semestre} onChange={(e) => update('semestre', e.target.value)} />
      </label>
    </div>
  );
};

export default FiltersPanel;
