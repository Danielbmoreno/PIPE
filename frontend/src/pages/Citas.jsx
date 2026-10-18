import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useToast } from '../components/ui/ToastContext.jsx';
import citasService from '../services/citasService.js';
import catalogService from '../services/catalogService.js';
import { getRepository } from '../services/supabaseService.js';
import { bogotaDay, emptyFilters, filterRecords, formatDate, sortAppointments } from '../lib/academic.js';
import { AppointmentCalendar, DataFilters, Motivation } from '../components/ui/AccompanimentWidgets.jsx';
import Modal from '../components/modals/Modal.jsx';
import ConfirmModal from '../components/modals/ConfirmModal.jsx';
import Loader from '../components/ui/Loader.jsx';
const initial = () => ({ estudiante_id: '', consejero_id: '', caso_id: '', fecha: bogotaDay(), hora: '17:00', hora_fin: '18:00', estado: 'programada', motivo: '' });
const states = ['programada', 'atendida', 'cancelada', 'no asistió'];
export default function Citas() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [params] = useSearchParams();
  const [filters, setFilters] = useState(() => ({ ...emptyFilters(), estudiante_id: params.get('estudiante') || '' }));
  const [rows, setRows] = useState([]);
  const [students, setStudents] = useState([]);
  const [cases, setCases] = useState([]);
  const [counselors, setCounselors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(initial);
  const [selected, setSelected] = useState(null);
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const load = async () => {
    try {
      const [a, s, c, access] = await Promise.all([citasService.getAll(), catalogService.getStudents(), catalogService.getCases(), getRepository().access()]);
      for (const r of [a,s,c]) if (!r.success) throw new Error(r.error);
      setRows(a.data); setStudents(s.data); setCases(c.data); setCounselors(access.consejeros || []); setError('');
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value, ...(e.target.name === 'estudiante_id' ? { caso_id: '' } : {}) }));
  const edit = (r) => { setSelected(r); setForm({ ...initial(), ...r, consejero_id: r.consejero_id || '', caso_id: r.caso_id || '', hora_fin: r.hora_fin || '', motivo: r.motivo || '' }); setOpen(true); };
  const save = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const values = { estudiante_id: Number(form.estudiante_id), consejero_id: user.rol_id === 'consejero' ? user.id : Number(form.consejero_id), caso_id: form.caso_id ? Number(form.caso_id) : null, fecha: form.fecha, hora: form.hora, hora_fin: form.hora_fin || null, estado: form.estado, motivo: form.motivo.trim() };
      const result = selected ? await citasService.update(selected.id, values) : await citasService.create(values);
      if (!result.success) throw new Error(result.error);
      setOpen(false); await load(); window.dispatchEvent(new Event('pipe:records-changed')); showToast('Cita guardada en Supabase.', 'success');
    } catch (err) { showToast(err.message, 'error'); } finally { setSaving(false); }
  };
  const remove = async () => {
    const result = await citasService.remove(selected.id);
    if (!result.success) { showToast(result.error,'error'); return; }
    setConfirm(false); await load(); window.dispatchEvent(new Event('pipe:records-changed'));
  };
  if (loading) return <Loader />;
  const filtered = sortAppointments(filterRecords(rows, filters));
  const studentName = (id) => students.find((s) => s.id === id)?.nombre || 'Estudiante no disponible';
  return <div className="page-shell"><div className="page-header space-between"><div><h1>Citas y encuentros</h1><p>Diferencia la programación de las atenciones efectivamente realizadas. Horarios de Bogotá.</p></div><button className="primary-button" onClick={() => { setSelected(null); setForm(initial()); setOpen(true); }}>Nueva cita</button></div><DataFilters students={students} value={filters} onChange={setFilters} states={states} />{error && <div className="alert-box" role="alert">{error}</div>}<div className="pipe-agenda-grid"><AppointmentCalendar appointments={rows} onDay={(fecha) => setFilters((f) => ({ ...f, desde: fecha, hasta: fecha }))} /><section className="section-card"><h2>Agenda autorizada</h2>{!error && (filtered.length ? <div className="pipe-agenda-list">{filtered.map((r) => <article key={r.id}><div><strong>{studentName(r.estudiante_id)}</strong><span>{formatDate(r.fecha)} · {r.hora}{r.hora_fin ? `–${r.hora_fin}` : ''}</span><p>{r.motivo || 'Motivo por confirmar'}</p><small>{r.estado} · {counselors.find((c) => c.id === r.consejero_id)?.nombre || 'Profesional pendiente de confirmar'}</small></div><div className="pipe-agenda-actions"><button className="secondary-button" onClick={() => setDetail(r)}>Ver</button><button className="secondary-button" onClick={() => edit(r)}>Editar</button>{user.rol_id === 'admin' && <button className="danger-button" onClick={() => { setSelected(r); setConfirm(true); }}>Eliminar</button>}</div></article>)}</div> : <p className="empty-state">No hay citas con estos filtros. PIPE te acompaña en tu camino universitario.</p>)}</section></div><Motivation />
    <Modal open={open} title={selected ? 'Editar cita' : 'Programar cita'} onClose={() => setOpen(false)} footer={<button form="appointment-form" type="submit" className="primary-button" disabled={saving}>{saving ? 'Guardando…' : 'Guardar cita'}</button>}><form id="appointment-form" className="form-grid" onSubmit={save}><label>Estudiante<select name="estudiante_id" value={form.estudiante_id} onChange={change} required disabled={Boolean(selected)}><option value="">Seleccionar</option>{students.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}</select></label>{user.rol_id === 'admin' && <label>Consejero asignado<select name="consejero_id" value={form.consejero_id} onChange={change} required><option value="">Seleccionar</option>{counselors.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}</select></label>}<label>Fecha confirmada<input type="date" name="fecha" value={form.fecha} onChange={change} required /></label><label>Hora inicial · Bogotá<input type="time" name="hora" value={form.hora} onChange={change} required /></label><label>Hora final · Bogotá<input type="time" name="hora_fin" value={form.hora_fin} onChange={change} required /></label><label>Estado<select name="estado" value={form.estado} onChange={change}>{states.map((state) => <option key={state} value={state}>{state}</option>)}</select></label><label>Caso relacionado<select name="caso_id" value={form.caso_id} onChange={change}><option value="">Sin caso</option>{cases.filter((r) => String(r.estudiante_id) === String(form.estudiante_id)).map((r) => <option key={r.id} value={r.id}>{r.descripcion}</option>)}</select></label><label>Motivo confirmado<textarea name="motivo" value={form.motivo} onChange={change} maxLength={2000} required /></label><p className="pipe-caption">Una fecha pasada no convierte automáticamente una cita en atención realizada.</p></form></Modal>
    <Modal open={Boolean(detail)} title="Detalle de cita" onClose={() => setDetail(null)}><div className="profile-item"><strong>{detail && studentName(detail.estudiante_id)}</strong><span>{detail?.fecha} · {detail?.hora} · America/Bogota</span><p>{detail?.motivo}</p><span>{detail?.estado}</span>{detail && <Link to={`/app/estudiantes/${detail.estudiante_id}`}>Ver expediente</Link>}</div></Modal><ConfirmModal open={confirm} title="Eliminar cita" message="Esta acción elimina el registro seleccionado. Confirma solo si corresponde." onConfirm={remove} onCancel={() => setConfirm(false)} />
  </div>;
}
