import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import casosService from '../services/casosService.js';
import catalogService from '../services/catalogService.js';
import alertasService from '../services/alertasService.js';
import Loader from '../components/ui/Loader.jsx';
import Modal from '../components/modals/Modal.jsx';
import ConfirmModal from '../components/modals/ConfirmModal.jsx';
import { useToast } from '../components/ui/ToastContext.jsx';

const initialForm = { estudiante_id: '', alerta_id: '', descripcion: '', estado: 'abierto' };
const states = ['abierto', 'en seguimiento', 'cerrado'];

const Casos = () => {
  const { searchQuery = '' } = useOutletContext() || {};
  const { user } = useAuth();
  const { showToast } = useToast();
  const [casos, setCasos] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [alertas, setAlertas] = useState([]);
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
  const alertName = (id) => id ? `Alerta #${id}` : 'Sin alerta';

  useEffect(() => {
    const load = async () => {
      try {
        const [casesResponse, studentsResponse, alertsResponse] = await Promise.all([casosService.getAll(), catalogService.getStudents(), alertasService.getAll()]);
        if (!casesResponse.success) throw new Error(casesResponse.error || 'No se pudieron cargar los casos.');
        if (!studentsResponse.success) throw new Error(studentsResponse.error || 'No se pudieron cargar los estudiantes.');
        if (!alertsResponse.success) throw new Error(alertsResponse.error || 'No se pudieron cargar las alertas.');
        setCasos(casesResponse.data || []); setEstudiantes(studentsResponse.data || []); setAlertas(alertsResponse.data || []);
      } catch (err) { console.error('Error cargando casos:', err); setError(err.message || 'No se pudieron cargar los casos.'); } finally { setLoading(false); }
    };
    load();
  }, []);

  useEffect(() => {
    const query = String(searchQuery).trim().toLowerCase();
    setFiltered(casos.filter((item) => [item.descripcion, item.estado, studentName(item.estudiante_id), alertName(item.alerta_id)].some((value) => String(value || '').toLowerCase().includes(query))));
  }, [casos, estudiantes, searchQuery]);

  const openCreate = () => { setSelected(null); setForm(initialForm); setModalOpen(true); };
  const openEdit = (item) => { setSelected(item); setForm({ estudiante_id: item.estudiante_id || '', alerta_id: item.alerta_id || '', descripcion: item.descripcion || '', estado: item.estado || 'abierto' }); setModalOpen(true); };
  const handleChange = (event) => setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  const handleSubmit = async (event) => {
    event.preventDefault(); setSaving(true);
    try {
      const payload = { estudiante_id: Number(form.estudiante_id), alerta_id: form.alerta_id ? Number(form.alerta_id) : null, usuario_id: user.id, descripcion: form.descripcion.trim(), estado: form.estado };
      const response = selected ? await casosService.update(selected.id, payload) : await casosService.create(payload);
      if (!response.success) throw new Error(response.error || 'No se pudo guardar el caso.');
      setCasos((previous) => selected ? previous.map((item) => item.id === selected.id ? response.data : item) : [response.data, ...previous]); setModalOpen(false); showToast(selected ? 'Caso actualizado.' : 'Caso creado.', 'success');
    } catch (err) { console.error('Error guardando caso:', err); showToast(err.message || 'No se pudo guardar el caso.', 'error'); } finally { setSaving(false); }
  };
  const handleDelete = async () => {
    if (!selected) return; const response = await casosService.remove(selected.id);
    if (!response.success) { console.error('Error eliminando caso:', response.error); showToast(response.error || 'No se pudo eliminar el caso.', 'error'); return; }
    setCasos((previous) => previous.filter((item) => item.id !== selected.id)); setConfirmOpen(false); showToast('Caso eliminado.', 'success');
  };

  if (loading) return <Loader />;
  return <div className="page-shell"><div className="page-header space-between"><div><h1>Casos</h1><p>Registra y administra los casos de seguimiento estudiantil.</p></div><button className="primary-button" onClick={openCreate}>Nuevo caso</button></div>{error && <div className="alert-box">{error}</div>}{filtered.length === 0 ? <div className="empty-state">No hay casos disponibles.</div> : <div className="table-card"><table><thead><tr><th>Estudiante</th><th>Alerta</th><th>Descripción</th><th>Estado</th><th className="actions-column">Acciones</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td>{studentName(item.estudiante_id)}</td><td>{alertName(item.alerta_id)}</td><td>{item.descripcion || '-'}</td><td>{item.estado || '-'}</td><td className="actions-column"><button className="secondary-button" onClick={() => { setSelected(item); setDetailOpen(true); }}>Ver</button><button className="secondary-button" onClick={() => openEdit(item)}>Editar</button><button className="danger-button" onClick={() => { setSelected(item); setConfirmOpen(true); }}>Eliminar</button></td></tr>)}</tbody></table></div>}
  <Modal title={selected ? 'Editar caso' : 'Nuevo caso'} open={modalOpen} onClose={() => setModalOpen(false)} footer={<div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setModalOpen(false)}>Cancelar</button><button type="submit" form="case-form" className="primary-button" disabled={saving}>{selected ? 'Actualizar' : 'Crear'}</button></div>}><form id="case-form" className="form-grid" onSubmit={handleSubmit}><label>Estudiante<select name="estudiante_id" value={form.estudiante_id} onChange={handleChange} required><option value="">Seleccionar estudiante</option>{estudiantes.map((student) => <option key={student.id} value={student.id}>{student.codigo || student.id} - {student.nombre || 'Sin nombre'}</option>)}</select></label><label>Alerta relacionada<select name="alerta_id" value={form.alerta_id} onChange={handleChange}><option value="">Sin alerta</option>{alertas.map((alert) => <option key={alert.id} value={alert.id}>Alerta #{alert.id} - {alert.descripcion || 'Sin descripción'}</option>)}</select></label><label>Descripción<input type="text" name="descripcion" value={form.descripcion} onChange={handleChange} required /></label><label>Estado<select name="estado" value={form.estado} onChange={handleChange} required>{states.map((state) => <option key={state} value={state}>{state}</option>)}</select></label></form></Modal>
  <Modal title="Detalle del caso" open={detailOpen} onClose={() => setDetailOpen(false)} footer={<button className="secondary-button" onClick={() => setDetailOpen(false)}>Cerrar</button>}><div className="profile-item"><strong>Estudiante</strong><span>{selected ? studentName(selected.estudiante_id) : '-'}</span></div><div className="profile-item"><strong>Alerta</strong><span>{selected ? alertName(selected.alerta_id) : '-'}</span></div><div className="profile-item"><strong>Descripción</strong><span>{selected?.descripcion || '-'}</span></div><div className="profile-item"><strong>Estado</strong><span>{selected?.estado || '-'}</span></div></Modal><ConfirmModal open={confirmOpen} title="Eliminar caso" message="¿Deseas eliminar este caso?" onConfirm={handleDelete} onCancel={() => setConfirmOpen(false)} /></div>;
};

export default Casos;
