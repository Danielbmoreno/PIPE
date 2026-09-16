import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import citasService from '../services/citasService.js';
import catalogService from '../services/catalogService.js';
import Loader from '../components/ui/Loader.jsx';
import Modal from '../components/modals/Modal.jsx';
import ConfirmModal from '../components/modals/ConfirmModal.jsx';
import { useToast } from '../components/ui/ToastContext.jsx';

const initialForm = { estudiante_id: '', fecha: '', hora: '', estado: 'programada' };
const states = ['programada', 'atendida', 'cancelada', 'no asistió'];

const Citas = () => {
  const { searchQuery = '' } = useOutletContext() || {};
  const { user } = useAuth();
  const { showToast } = useToast();
  const [citas, setCitas] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const studentName = (id) => { const item = estudiantes.find((student) => String(student.id) === String(id)); return item ? `${item.codigo || item.id} - ${item.nombre || 'Sin nombre'}` : `Estudiante ${id}`; };

  useEffect(() => {
    const load = async () => {
      try {
        const [appointmentsResponse, studentsResponse] = await Promise.all([citasService.getAll(), catalogService.getStudents()]);
        if (!appointmentsResponse.success) throw new Error(appointmentsResponse.error || 'No se pudieron cargar las citas.');
        if (!studentsResponse.success) throw new Error(studentsResponse.error || 'No se pudieron cargar los estudiantes.');
        setCitas(appointmentsResponse.data || []); setEstudiantes(studentsResponse.data || []);
      } catch (err) { console.error('Error cargando citas:', err); setError(err.message || 'No se pudieron cargar las citas.'); } finally { setLoading(false); }
    };
    load();
  }, []);
  useEffect(() => { const query = String(searchQuery).trim().toLowerCase(); setFiltered(citas.filter((item) => [item.fecha, item.hora, item.estado, studentName(item.estudiante_id)].some((value) => String(value || '').toLowerCase().includes(query)))); }, [citas, estudiantes, searchQuery]);
  const openCreate = () => { setSelected(null); setForm(initialForm); setModalOpen(true); };
  const openEdit = (item) => { setSelected(item); setForm({ estudiante_id: item.estudiante_id || '', fecha: item.fecha || '', hora: item.hora || '', estado: item.estado || 'programada' }); setModalOpen(true); };
  const handleChange = (event) => setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  const handleSubmit = async (event) => { event.preventDefault(); setSaving(true); try { const payload = { estudiante_id: Number(form.estudiante_id), usuario_id: user.id, fecha: form.fecha, hora: form.hora, estado: form.estado }; const response = selected ? await citasService.update(selected.id, payload) : await citasService.create(payload); if (!response.success) throw new Error(response.error || 'No se pudo guardar la cita.'); setCitas((previous) => selected ? previous.map((item) => item.id === selected.id ? response.data : item) : [response.data, ...previous]); setModalOpen(false); showToast(selected ? 'Cita actualizada.' : 'Cita creada.', 'success'); } catch (err) { console.error('Error guardando cita:', err); showToast(err.message || 'No se pudo guardar la cita.', 'error'); } finally { setSaving(false); } };
  const handleDelete = async () => { if (!selected) return; const response = await citasService.remove(selected.id); if (!response.success) { console.error('Error eliminando cita:', response.error); showToast(response.error || 'No se pudo eliminar la cita.', 'error'); return; } setCitas((previous) => previous.filter((item) => item.id !== selected.id)); setConfirmOpen(false); showToast('Cita eliminada.', 'success'); };
  if (loading) return <Loader />;
  return <div className="page-shell"><div className="page-header space-between"><div><h1>Citas</h1><p>Agenda y controla las citas entre consejeros y estudiantes.</p></div><button className="primary-button" onClick={openCreate}>Nueva cita</button></div>{error && <div className="alert-box">{error}</div>}{filtered.length === 0 ? <div className="empty-state">No hay citas disponibles.</div> : <div className="table-card"><table><thead><tr><th>Estudiante</th><th>Fecha</th><th>Hora</th><th>Estado</th><th className="actions-column">Acciones</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td>{studentName(item.estudiante_id)}</td><td>{item.fecha || '-'}</td><td>{item.hora || '-'}</td><td>{item.estado || '-'}</td><td className="actions-column"><button className="secondary-button" onClick={() => { setSelected(item); setDetailOpen(true); }}>Ver</button><button className="secondary-button" onClick={() => openEdit(item)}>Editar</button><button className="danger-button" onClick={() => { setSelected(item); setConfirmOpen(true); }}>Eliminar</button></td></tr>)}</tbody></table></div>}
    <Modal title={selected ? 'Editar cita' : 'Nueva cita'} open={modalOpen} onClose={() => setModalOpen(false)} footer={<div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setModalOpen(false)}>Cancelar</button><button type="submit" form="appointment-form" className="primary-button" disabled={saving}>{selected ? 'Actualizar' : 'Crear'}</button></div>}><form id="appointment-form" className="form-grid" onSubmit={handleSubmit}><label>Estudiante<select name="estudiante_id" value={form.estudiante_id} onChange={handleChange} required><option value="">Seleccionar estudiante</option>{estudiantes.map((student) => <option key={student.id} value={student.id}>{student.codigo || student.id} - {student.nombre || 'Sin nombre'}</option>)}</select></label><label>Fecha<input type="date" name="fecha" value={form.fecha} onChange={handleChange} required /></label><label>Hora<input type="time" name="hora" value={form.hora} onChange={handleChange} required /></label><label>Estado<select name="estado" value={form.estado} onChange={handleChange} required>{states.map((state) => <option key={state} value={state}>{state}</option>)}</select></label></form></Modal>
    <Modal title="Detalle de cita" open={detailOpen} onClose={() => setDetailOpen(false)} footer={<button className="secondary-button" onClick={() => setDetailOpen(false)}>Cerrar</button>}><div className="profile-item"><strong>Estudiante</strong><span>{selected ? studentName(selected.estudiante_id) : '-'}</span></div><div className="profile-item"><strong>Fecha</strong><span>{selected?.fecha || '-'}</span></div><div className="profile-item"><strong>Hora</strong><span>{selected?.hora || '-'}</span></div><div className="profile-item"><strong>Estado</strong><span>{selected?.estado || '-'}</span></div></Modal><ConfirmModal open={confirmOpen} title="Eliminar cita" message="¿Deseas eliminar esta cita?" onConfirm={handleDelete} onCancel={() => setConfirmOpen(false)} /></div>;
};

export default Citas;
