import { useEffect, useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { bogotaDay, formatDate, normalize } from '../../lib/academic.js';
import { Icon } from './Icon.jsx';

const messages = ['Tu esfuerzo construye oportunidades.', 'Cada paso cuenta para alcanzar tu meta.', 'PIPE te acompaña en tu camino universitario.', 'El futuro comienza con las decisiones de hoy.', 'Tu bienestar también es parte de tu éxito.', 'Cada paso cuenta en tu camino profesional.', 'PIPE te acompaña en cada etapa.', 'Tu permanencia es nuestra prioridad.', 'El esfuerzo de hoy construye el futuro.', 'Pedir acompañamiento también es avanzar.', 'Cada logro merece ser reconocido.', 'Tu bienestar es parte de tu éxito.', 'Un semestre más cerca de tus sueños.'];
export function Motivation({ compact = false }) {
  const [index, setIndex] = useState(0);
  useEffect(() => { const timer = window.setInterval(() => setIndex((i) => (i + 1) % messages.length), 18000); return () => window.clearInterval(timer); }, []);
  return <div className={`pipe-motivation ${compact ? 'compact' : ''}`}><span aria-hidden="true">✦</span><p key={index}>{messages[index]}</p></div>;
}
export function DataFilters({ students, value, onChange, states = [] }) {
  const change = (e) => onChange({ ...value, [e.target.name]: e.target.value });
  return <section className="pipe-data-filters" aria-label="Filtros de acompañamiento"><label>Estudiante<select name="estudiante_id" value={value.estudiante_id} onChange={change}><option value="">Todos los autorizados</option>{students.map((e) => <option value={e.id} key={e.id}>{e.nombre}</option>)}</select></label><label>Desde<input name="desde" type="date" value={value.desde} max={value.hasta || undefined} onChange={change} /></label><label>Hasta<input name="hasta" type="date" value={value.hasta} min={value.desde || undefined} onChange={change} /></label>{states.length > 0 && <label>Estado<select name="estado" value={value.estado} onChange={change}><option value="">Todos</option>{states.map((s) => <option key={s} value={s}>{s}</option>)}</select></label>}<button className="secondary-button" onClick={() => onChange({ estudiante_id: '', desde: '', hasta: '', estado: '' })}>Limpiar</button></section>;
}
export function RecordTimeline({ events, limit = 12 }) {
  if (!events.length) return <p className="empty-state">Aún no hay actividades registradas en este proceso. Cada paso cuenta.</p>;
  return <ol className="pipe-record-timeline">{events.slice(0, limit).map((r) => <li key={r.event_id}><span><Icon name={r.tipo === 'citas' ? 'calendar' : 'check'} size={17} /></span><div><small>{r.tipo} · {r.estado} · {formatDate(r.fecha)}</small><strong>{r.titulo}</strong>{r.estudiante_id && <Link to={`/app/estudiantes/${r.estudiante_id}`}>Ver expediente</Link>}</div></li>)}</ol>;
}
export function AppointmentCalendar({ appointments, onDay }) {
  const [monthDate, setMonth] = useState(() => `${bogotaDay().slice(0, 7)}-01`);
  const [year, month] = monthDate.split('-').map(Number);
  const offset = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const shift = (n) => { const date = new Date(Date.UTC(year, month - 1 + n, 1)); setMonth(date.toISOString().slice(0, 10)); };
  return <section className="section-card pipe-calendar"><div className="section-head"><h2>Calendario de citas</h2><Link to="/app/citas">Ver agenda →</Link></div><div className="pipe-calendar-month"><button className="secondary-button" aria-label="Mes anterior" onClick={() => shift(-1)}>‹</button><strong>{formatDate(monthDate, { month: 'long', year: 'numeric' })}</strong><button className="secondary-button" aria-label="Mes siguiente" onClick={() => shift(1)}>›</button></div><div className="pipe-calendar-grid">{['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => <small key={i}>{d}</small>)}{Array.from({ length: offset }, (_, i) => <span key={`blank-${i}`} />)}{Array.from({ length: days }, (_, i) => { const date = `${monthDate.slice(0, 7)}-${String(i + 1).padStart(2, '0')}`; const entries = appointments.filter((r) => r.fecha === date && normalize(r.estado) !== 'cancelada'); return <button className={`${date === bogotaDay() ? 'is-today' : ''} ${entries.length ? 'has-appointment' : ''}`} key={date} aria-label={`${formatDate(date)}: ${entries.length} citas`} onClick={() => onDay?.(date)}>{i + 1}{entries.length > 0 && <i />}</button>; })}</div><p className="pipe-caption">Horarios de America/Bogota · UTC−5</p></section>;
}
export function AcademicEvolution({ records }) {
  const id = useId();
  const done = records.filter((r) => normalize(r.estado) === 'completado' && r.realizado_en);
  const days = [...new Set(done.map((r) => bogotaDay(new Date(r.realizado_en))))].sort().slice(-6);
  const series = days.map((day) => ({ day, count: done.filter((r) => bogotaDay(new Date(r.realizado_en)) <= day).length }));
  const max = Math.max(1, ...series.map((r) => r.count));
  const points = series.map((r, i) => [40 + i * (320 / Math.max(1, series.length - 1)), 140 - r.count / max * 100]);
  return <section className="section-card pipe-evolution"><div className="section-head"><h2>Evolución del acompañamiento</h2><span>Seguimientos completados</span></div>{series.length ? <svg viewBox="0 0 400 180" role="img" aria-labelledby={id}><title id={id}>{series.map((r) => `${formatDate(r.day)}: ${r.count} completados`).join('; ')}</title>{[40, 90, 140].map((y) => <line key={y} x1="30" x2="380" y1={y} y2={y} stroke="#e5edf5" />)}<polyline points={points.map((p) => p.join(',')).join(' ')} fill="none" stroke="#2862aa" strokeWidth="3" />{points.map(([x, y], i) => <g key={series[i].day}><circle cx={x} cy={y} r="5" fill="#f8c84b" /><text x={x} y={y - 10} textAnchor="middle">{series[i].count}</text><text x={x} y="170" textAnchor="middle">{formatDate(series[i].day, { day: 'numeric', month: 'short' })}</text></g>)}</svg> : <div className="empty-state">La gráfica aparecerá cuando existan seguimientos efectivamente completados.</div>}<p className="pipe-caption">Conteo acumulado de registros reales autorizados. No representa calificaciones ni una predicción de deserción.</p></section>;
}
