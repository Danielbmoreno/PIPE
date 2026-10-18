import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import dashboardService from '../services/dashboardService.js';
import { activityHistory, calculateMetrics, emptyFilters, filterRecords, normalize } from '../lib/academic.js';
import { AcademicEvolution, DataFilters, Motivation, RecordTimeline } from '../components/ui/AccompanimentWidgets.jsx';
import Loader from '../components/ui/Loader.jsx';
import Pagination from '../components/ui/Pagination.jsx';

export default function ProcessOverview({ mode = 'estadisticas' }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState(emptyFilters);
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const activity = mode === 'actividad';
  const staff = user.rol_id !== 'estudiante';
  useEffect(() => {
    let active = true;
    const load = async () => {
      const result = await dashboardService.getOverview();
      if (!active) return;
      if (!result.success) setError(result.error || 'No se pudo consultar el proceso.');
      else { setData(result.data); setError(''); }
    };
    load();
    for (const event of ['pipe:records-changed', 'pipe:students-changed']) window.addEventListener(event, load);
    return () => { active = false; for (const event of ['pipe:records-changed', 'pipe:students-changed']) window.removeEventListener(event, load); };
  }, []);
  useEffect(() => { setPage(1); }, [filters, type]);
  const selected = useMemo(() => data && Object.fromEntries(Object.entries(data).map(([table, rows]) => [table,
    table === 'estudiantes' ? rows.filter((r) => !filters.estudiante_id || String(r.id) === filters.estudiante_id)
      : table === 'programas' ? rows : filterRecords(rows, filters)
  ])), [data, filters]);
  const title = activity ? 'Actividad reciente y programada' : 'Estadísticas del acompañamiento';
  if (error) return <div className="page-shell"><h1>{title}</h1><div className="alert-box" role="alert">{error}</div></div>;
  if (!selected) return <Loader />;
  const metrics = calculateMetrics(selected);
  const indicators = [
    ['Expedientes autorizados', metrics.totalEstudiantes], ['Próximas citas programadas', metrics.citasProgramadas],
    ['Consultas realizadas', metrics.consultasRealizadas], ['Seguimientos completados', metrics.seguimientosCompletados],
    ...(staff ? [['Casos abiertos o en seguimiento', metrics.casosAbiertos], ['Alertas registradas', metrics.alertasRegistradas], ['Intervenciones registradas', metrics.intervencionesRegistradas]] : [])
  ];
  const tables = staff ? ['citas', 'consultas', 'seguimientos', 'casos', 'alertas', 'intervenciones'] : ['citas', 'consultas', 'seguimientos'];
  const history = activityHistory(selected).filter((r) => !type || r.tipo === type);
  const pending = selected.seguimientos.filter((r) => normalize(r.estado) === 'pendiente').length;
  return <div className="page-shell">
    <div className="page-header"><h1>{title}</h1><p>Información consultada en Supabase dentro de tu autorización. La programación y las actividades realizadas conservan estados separados.</p></div>
    <DataFilters students={data.estudiantes} value={filters} onChange={setFilters} />
    {activity ? <section className="section-card">
      <label>Tipo de registro<select value={type} onChange={(e) => setType(e.target.value)}><option value="">Todos los permitidos</option>{tables.map((table) => <option key={table} value={table}>{table}</option>)}</select></label>
      <RecordTimeline events={history.slice((page - 1) * 12, page * 12)} />
      <Pagination currentPage={page} totalPages={Math.max(1, Math.ceil(history.length / 12))} onPageChange={setPage} />
    </section> : <>
      <div className="table-card"><table><caption>Indicadores según los filtros seleccionados</caption><thead><tr><th>Indicador</th><th>Registros</th></tr></thead><tbody>{indicators.map(([label, value]) => <tr key={label}><td>{label}</td><td>{value}</td></tr>)}<tr><td>Seguimientos pendientes</td><td>{pending}</td></tr></tbody></table></div>
      <div className="table-card"><table><caption>Estados registrados por módulo</caption><thead><tr><th>Módulo</th><th>Estado o tipo</th><th>Cantidad</th></tr></thead><tbody>{tables.flatMap((table) => {
        const groups = new Map();
        for (const row of selected[table]) { const state = row.estado || (table === 'consultas' ? row.tipo : 'registrado') || 'Sin confirmar'; groups.set(state, (groups.get(state) || 0) + 1); }
        return groups.size ? [...groups].map(([state, count]) => <tr key={`${table}-${state}`}><td>{table}</td><td>{state}</td><td>{count}</td></tr>) : <tr key={table}><td>{table}</td><td>Sin registros autorizados</td><td>0</td></tr>;
      })}</tbody></table></div>
      <AcademicEvolution records={selected.seguimientos} />
    </>}
    <Motivation />
  </div>;
}
