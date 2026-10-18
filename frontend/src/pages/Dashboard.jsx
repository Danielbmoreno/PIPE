import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import dashboardService from '../services/dashboardService.js';
import { activityHistory, calculateMetrics, emptyFilters, filterRecords, isUpcoming, sortAppointments } from '../lib/academic.js';
import { AcademicEvolution, AppointmentCalendar, DataFilters, Motivation, RecordTimeline } from '../components/ui/AccompanimentWidgets.jsx';
import { Icon } from '../components/ui/Icon.jsx';
import Loader from '../components/ui/Loader.jsx';
import StudentDashboard from './StudentDashboard.jsx';
import StudentWelcome from '../components/student/StudentWelcome.jsx';
import SpaceLinks from '../components/student/SpaceLinks.jsx';
import FloatingMinu from '../components/student/FloatingMinu.jsx';

export function StaffDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState(emptyFilters);
  const [type, setType] = useState('');
  useEffect(() => {
    let active = true;
    const load = async () => {
      const result = await dashboardService.getOverview();
      if (!active) return;
      if (result.success) { setData(result.data); setError(''); } else setError(result.error);
    };
    load(); window.addEventListener('pipe:records-changed', load); window.addEventListener('pipe:students-changed', load);
    return () => { active = false; window.removeEventListener('pipe:records-changed', load); window.removeEventListener('pipe:students-changed', load); };
  }, []);
  const selected = useMemo(() => data && Object.fromEntries(Object.entries(data).map(([table, rows]) => [table, table === 'estudiantes' ? rows.filter((r) => !filters.estudiante_id || String(r.id) === filters.estudiante_id) : table === 'programas' ? rows : filterRecords(rows, filters)])), [data, filters]);
  if (!data && !error) return <Loader />;
  if (error) return <div className="page-shell"><h1>Dashboard</h1><div className="alert-box" role="alert">{error}</div><p>No se muestran indicadores incompletos ni valores de ejemplo.</p></div>;
  const metrics = calculateMetrics(selected);
  const cards = [['totalEstudiantes', 'Estudiantes autorizados', 'students', 'estudiantes'], ['estudiantesBajoRiesgo', 'Riesgo bajo registrado', 'heart', 'estudiantes'], ['citasProgramadas', 'Próximas citas', 'calendar', 'citas'], ['consultasRealizadas', 'Consultas realizadas', 'chat', 'consultas'], ['casosAbiertos', 'Casos en seguimiento', 'folder', 'casos'], ['intervencionesRegistradas', 'Intervenciones', 'check', 'intervenciones'], ['alertasRegistradas', 'Alertas registradas', 'alert', 'alertas'], ['seguimientosCompletados', 'Compromisos completados', 'chart', 'seguimientos']];
  const history = activityHistory(selected).filter((r) => !type || r.tipo === type);
  const upcoming = sortAppointments(selected.citas.filter((r) => isUpcoming(r)));
  return <div className="page-shell pipe-staff-dashboard">
    <section className="student-hero pipe-staff-welcome"><div className="hero-copy"><span className="eyebrow">{user.rol_id === 'consejero' ? 'MIS ESTUDIANTES ASIGNADOS' : 'ACOMPAÑAMIENTO INSTITUCIONAL'}</span><StudentWelcome name={user.nombre} heading="h1" /><p>Detrás de cada estudiante hay un proyecto de vida. Sigamos acompañándolo.</p></div><span className="pipe-hero-symbol" aria-hidden="true">✦</span></section>
    <DataFilters students={data.estudiantes} value={filters} onChange={setFilters} />
    <div className="pipe-live-metrics">{cards.map(([key, label, icon, path]) => <Link className="section-card pipe-live-metric" key={key} to={`/app/${path}`}><Icon name={icon} /><span>{label}</span><strong>{metrics[key]}</strong><small>Según registros y filtros autorizados</small></Link>)}</div>
    <div className="pipe-overview-grid"><div><AcademicEvolution records={selected.seguimientos} /><section className="section-card"><div className="section-head"><h2>Estudiantes en acompañamiento</h2><Link to="/app/estudiantes">Ver expedientes →</Link></div>{selected.estudiantes.length ? selected.estudiantes.map((e) => <Link className="pipe-student-row" key={e.id} to={`/app/estudiantes/${e.id}`}><span className="avatar avatar-yellow">{e.nombre?.split(' ').slice(0, 2).map((v) => v[0]).join('')}</span><span><strong>{e.nombre}</strong><small>{data.programas.find((p) => p.id === e.programa_id)?.nombre || 'Programa pendiente'} · {e.semestre ? `Semestre ${e.semestre}` : 'Semestre pendiente'}</small></span><span className="badge">{e.nivel_riesgo || 'Riesgo sin confirmar'}</span><Icon name="arrow" size={17} /></Link>) : <p className="empty-state">No hay estudiantes asignados a tu cuenta con esta selección.</p>}</section></div><div><AppointmentCalendar appointments={selected.citas} onDay={(fecha) => setFilters((f) => ({ ...f, desde: fecha, hasta: fecha }))} /><section className="section-card"><div className="section-head"><h2>Próximos encuentros</h2></div>{upcoming.slice(0, 4).map((r) => <div className="pipe-upcoming-row" key={r.id}><strong>{data.estudiantes.find((e) => e.id === r.estudiante_id)?.nombre}</strong><span>{r.fecha} · {r.hora} · Bogotá</span><small>{r.motivo || 'Motivo por confirmar'}</small></div>)}{!upcoming.length && <p className="empty-state">No hay próximas citas programadas.</p>}</section></div></div>
    <section className="section-card"><div className="section-head"><h2>Actividad del proceso</h2><label>Tipo de actividad<select value={type} onChange={(e) => setType(e.target.value)}><option value="">Todas</option>{['consultas', 'seguimientos', 'intervenciones', 'citas', 'alertas', 'casos'].map((v) => <option key={v} value={v}>{v}</option>)}</select></label></div><RecordTimeline events={history} /></section><Motivation />
    {user.rol_id === 'admin' && <><SpaceLinks /><FloatingMinu /></>}
  </div>;
}
export default function Dashboard() { const { user } = useAuth(); return user?.rol_id === 'estudiante' ? <StudentDashboard /> : <StaffDashboard />; }
