import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../components/ui/ToastContext.jsx';
import { getConsultas, getSeguimientos, createConsulta, createSeguimiento, updateSeguimiento } from '../services/acompaniamientoService.js';
import catalogService from '../services/catalogService.js';
import citasService from '../services/citasService.js';
import { bogotaDay, emptyFilters, filterRecords, formatDate } from '../lib/academic.js';
import { DataFilters, Motivation } from '../components/ui/AccompanimentWidgets.jsx';
import Modal from '../components/modals/Modal.jsx';
import Loader from '../components/ui/Loader.jsx';
export default function AccompanimentRecords({ type }) {
  const followup = type === 'seguimientos';
  const { user } = useAuth();
  const { showToast } = useToast();
  const [params] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [students, setStudents] = useState([]);
  const [cases, setCases] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [filters, setFilters] = useState(() => ({ ...emptyFilters(), estudiante_id: params.get('estudiante') || '' }));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [completion, setCompletion] = useState(null);
  const [completionResult, setCompletionResult] = useState('');
  const [form, setForm] = useState({ estudiante_id: '', caso_id: '', cita_id: '', fecha: bogotaDay(), descripcion: '', tipo: 'consulta', estado: 'pendiente', resultado: '' });
  const load = async () => {
    try {
      const results = await Promise.all([followup ? getSeguimientos() : getConsultas(), catalogService.getStudents(), catalogService.getCases(), citasService.getAll()]);
      const failed = results.find((r) => !r.success); if (failed) throw new Error(failed.error);
      setRows(results[0].data); setStudents(results[1].data); setCases(results[2].data); setAppointments(results[3].data); setError('');
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [type]);
  const change = (e) => setForm((f) => e.target.name === 'estudiante_id' ? { ...f, estudiante_id: e.target.value, caso_id: '', cita_id: '' } : { ...f, [e.target.name]: e.target.value });
  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { estudiante_id: Number(form.estudiante_id), caso_id: form.caso_id ? Number(form.caso_id) : null, cita_id: form.cita_id ? Number(form.cita_id) : null, fecha: form.fecha, descripcion: form.descripcion.trim(), ...(followup ? { estado: form.estado, resultado: form.resultado.trim() || null } : { tipo: form.tipo }) };
      const result = followup ? await createSeguimiento(payload) : await createConsulta(payload);
      if (!result.success) throw new Error(result.error);
      setOpen(false); await load(); window.dispatchEvent(new Event('pipe:records-changed')); showToast('Registro guardado en Supabase.', 'success');
    } catch (err) { showToast(err.message, 'error'); } finally { setSaving(false); }
  };
  const complete = (row) => { setCompletion(row); setCompletionResult(''); };
  const finish = async (event) => {
    event.preventDefault(); setSaving(true);
    try {
      if (!completionResult.trim()) throw new Error('Describe el resultado efectivamente observado.');
      const result = await updateSeguimiento(completion.id, { estado: 'completado', resultado: completionResult.trim() });
      if (!result.success) throw new Error(result.error);
      setCompletion(null); await load(); window.dispatchEvent(new Event('pipe:records-changed'));
      showToast('Seguimiento completado con su resultado.', 'success');
    } catch (err) { showToast(err.message, 'error'); } finally { setSaving(false); }
  };
  if (loading) return <Loader />;
  const filtered = filterRecords(rows, filters);
  const title = followup ? 'Seguimientos' : 'Consultas y observaciones';
  return <div className="page-shell"><div className="page-header space-between"><div><h1>{title}</h1><p>{followup ? 'Organiza compromisos y registra sus resultados cuando se cumplan.' : 'Registra únicamente atenciones y observaciones efectivamente realizadas.'}</p></div>{['admin', 'consejero'].includes(user.rol_id) && <button className="primary-button" onClick={() => { setForm({ estudiante_id: filters.estudiante_id, caso_id: '', cita_id: '', fecha: bogotaDay(), descripcion: '', tipo: 'consulta', estado: 'pendiente', resultado: '' }); setOpen(true); }}>Nuevo registro</button>}</div><DataFilters students={students} value={filters} onChange={setFilters} states={followup ? ['pendiente', 'completado', 'cancelado'] : []} />{error && <div className="alert-box" role="alert">{error}</div>}{!error && (filtered.length ? <div className="table-card"><table><thead><tr><th>Estudiante</th><th>Fecha</th><th>Registro</th><th>{followup ? 'Estado' : 'Tipo'}</th><th>Proceso</th></tr></thead><tbody>{filtered.map((r) => <tr key={r.id}><td>{students.find((s) => s.id === r.estudiante_id)?.nombre}</td><td>{formatDate(r.fecha)}</td><td>{r.descripcion}{r.resultado && <p>{r.resultado}</p>}</td><td>{followup ? r.estado : r.tipo}</td><td><Link to={`/app/estudiantes/${r.estudiante_id}`}>Ver expediente</Link>{followup && r.estado === 'pendiente' && user.rol_id !== 'estudiante' && <button className="secondary-button" onClick={() => complete(r)}>Marcar completado</button>}</td></tr>)}</tbody></table></div> : <div className="empty-state">Aún no hay {followup ? 'seguimientos' : 'consultas'} con estos filtros. Cada paso cuenta.</div>)}<Motivation />
    <Modal title={`Registrar ${followup ? 'seguimiento' : 'consulta realizada'}`} open={open} onClose={() => setOpen(false)} footer={<button className="primary-button" type="submit" form="accompaniment-form" disabled={saving}>{saving ? 'Guardando…' : 'Guardar registro'}</button>}><form id="accompaniment-form" className="form-grid" onSubmit={save}><label>Estudiante<select name="estudiante_id" value={form.estudiante_id} onChange={change} required><option value="">Seleccionar</option>{students.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}</select></label><label>Fecha {followup ? 'del compromiso' : 'de atención'}<input type="date" name="fecha" value={form.fecha} max={followup ? undefined : bogotaDay()} onChange={change} required /></label>{!followup && <label>Tipo<select name="tipo" value={form.tipo} onChange={change}><option value="consulta">Consulta</option><option value="observacion">Observación</option></select></label>}<label>Caso relacionado<select name="caso_id" value={form.caso_id} onChange={change}><option value="">Sin caso relacionado</option>{cases.filter((r) => String(r.estudiante_id) === form.estudiante_id).map((r) => <option key={r.id} value={r.id}>{r.descripcion}</option>)}</select></label><label>Cita relacionada<select name="cita_id" value={form.cita_id} onChange={change}><option value="">Sin cita relacionada</option>{appointments.filter((r) => String(r.estudiante_id) === form.estudiante_id).map((r) => <option key={r.id} value={r.id}>{r.fecha} · {r.hora}</option>)}</select></label><label>Descripción profesional<textarea name="descripcion" value={form.descripcion} onChange={change} maxLength={2000} required /></label></form></Modal>
    <Modal title="Completar seguimiento realizado" open={Boolean(completion)} onClose={() => setCompletion(null)} footer={<button type="submit" form="complete-followup" className="primary-button" disabled={saving}>{saving ? 'Guardando…' : 'Confirmar resultado real'}</button>}><p>{completion?.descripcion}</p><p>Completa este registro únicamente cuando el compromiso se haya cumplido. Se conservará la fecha efectiva de finalización.</p><form id="complete-followup" onSubmit={finish} className="form-grid"><label>Resultado observado<textarea value={completionResult} onChange={(e) => setCompletionResult(e.target.value)} required maxLength={2000} /></label></form></Modal>
  </div>;
}
