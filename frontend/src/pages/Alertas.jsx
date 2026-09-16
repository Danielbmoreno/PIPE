import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import alertasService from '../services/alertasService.js';
import catalogService from '../services/catalogService.js';
import Loader from '../components/ui/Loader.jsx';
import Modal from '../components/modals/Modal.jsx';
import ConfirmModal from '../components/modals/ConfirmModal.jsx';
import { useToast } from '../components/ui/ToastContext.jsx';

const initialForm = { estudiante_id: '', descripcion: '', nivel_riesgo: '' };
const riskLevels = ['bajo', 'medio', 'alto', 'critico'];

const Alertas = () => {
  const { searchQuery = '' } = useOutletContext() || {};
  const { user } = useAuth();
  const { showToast } = useToast();
  const [alertas, setAlertas] = useState([]);
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

  const studentName = (studentId) => {
    const student = estudiantes.find((item) => String(item.id) === String(studentId));
    return student ? `${student.codigo || student.id} - ${student.nombre || 'Sin nombre'}` : `Estudiante ${studentId}`;
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [alertsResponse, studentsResponse] = await Promise.all([alertasService.getAll(), catalogService.getStudents()]);
        if (!alertsResponse.success) throw new Error(alertsResponse.error || 'No se pudieron cargar las alertas.');
        if (!studentsResponse.success) throw new Error(studentsResponse.error || 'No se pudieron cargar los estudiantes.');
        setAlertas(alertsResponse.data || []);
        setEstudiantes(studentsResponse.data || []);
      } catch (err) {
        console.error('Error cargando alertas:', err);
        setError(err.message || 'No se pudieron cargar las alertas.');
      } finally { setLoading(false); }
    };
    load();
  }, []);

  useEffect(() => {
    const query = String(searchQuery).trim().toLowerCase();
    setFiltered(alertas.filter((item) => [item.descripcion, item.nivel_riesgo, studentName(item.estudiante_id)]
      .some((value) => String(value || '').toLowerCase().includes(query))));
  }, [alertas, estudiantes, searchQuery]);

  const openCreate = () => { setSelected(null); setForm(initialForm); setModalOpen(true); };
  const openEdit = (alert) => { setSelected(alert); setForm({ estudiante_id: alert.estudiante_id || '', descripcion: alert.descripcion || '', nivel_riesgo: alert.nivel_riesgo || '' }); setModalOpen(true); };
  const handleChange = (event) => setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = { estudiante_id: Number(form.estudiante_id), usuario_id: user.id, descripcion: form.descripcion.trim(), nivel_riesgo: form.nivel_riesgo };
      const response = selected ? await alertasService.update(selected.id, payload) : await alertasService.create(payload);
      if (!response.success) throw new Error(response.error || 'No se pudo guardar la alerta.');
      setAlertas((previous) => selected ? previous.map((item) => item.id === selected.id ? response.data : item) : [response.data, ...previous]);
      setModalOpen(false);
      showToast(selected ? 'Alerta actualizada.' : 'Alerta creada.', 'success');
    } catch (err) {
      console.error('Error guardando alerta:', err);
      showToast(err.message || 'No se pudo guardar la alerta.', 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    const response = await alertasService.remove(selected.id);
    if (!response.success) { console.error('Error eliminando alerta:', response.error); showToast(response.error || 'No se pudo eliminar la alerta.', 'error'); return; }
    setAlertas((previous) => previous.filter((item) => item.id !== selected.id));
    setConfirmOpen(false);
    showToast('Alerta eliminada.', 'success');
  };

  if (loading) return <Loader />;
  return <div className="page-shell">
    <div className="page-header space-between"><div><h1>Alertas</h1><p>Registra y administra alertas de seguimiento para estudiantes.</p></div><button className="primary-button" onClick={openCreate}>Nueva alerta</button></div>
    {error && <div className="alert-box">{error}</div>}
    {filtered.length === 0 ? <div className="empty-state">No hay alertas disponibles.</div> : <div className="table-card"><table><thead><tr><th>Estudiante</th><th>Descripción</th><th>Nivel</th><th>Fecha</th><th className="actions-column">Acciones</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td>{studentName(item.estudiante_id)}</td><td>{item.descripcion || '-'}</td><td>{item.nivel_riesgo || '-'}</td><td>{item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}</td><td className="actions-column"><button className="secondary-button" onClick={() => { setSelected(item); setDetailOpen(true); }}>Ver</button><button className="secondary-button" onClick={() => openEdit(item)}>Editar</button><button className="danger-button" onClick={() => { setSelected(item); setConfirmOpen(true); }}>Eliminar</button></td></tr>)}</tbody></table></div>}
  <Modal title={selected ? 'Editar alerta' : 'Nueva alerta'} open={modalOpen} onClose={() => setModalOpen(false)} footer={<div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setModalOpen(false)}>Cancelar</button><button type="submit" form="alert-form" className="primary-button" disabled={saving}>{selected ? 'Actualizar' : 'Crear'}</button></div>}><form id="alert-form" className="form-grid" onSubmit={handleSubmit}><label>Estudiante<select name="estudiante_id" value={form.estudiante_id} onChange={handleChange} required><option value="">Seleccionar estudiante</option>{estudiantes.map((student) => <option key={student.id} value={student.id}>{student.codigo || student.id} - {student.nombre || 'Sin nombre'}</option>)}</select></label><label>Descripción<input type="text" name="descripcion" value={form.descripcion} onChange={handleChange} required /></label><label>Nivel de riesgo<select name="nivel_riesgo" value={form.nivel_riesgo} onChange={handleChange} required><option value="">Seleccionar nivel</option>{riskLevels.map((level) => <option key={level} value={level}>{level[0].toUpperCase() + level.slice(1)}</option>)}</select></label></form></Modal>
  <Modal title="Detalle de alerta" open={detailOpen} onClose={() => setDetailOpen(false)} footer={<button className="secondary-button" onClick={() => setDetailOpen(false)}>Cerrar</button>}><div className="profile-item"><strong>Estudiante</strong><span>{selected ? studentName(selected.estudiante_id) : '-'}</span></div><div className="profile-item"><strong>Descripción</strong><span>{selected?.descripcion || '-'}</span></div><div className="profile-item"><strong>Nivel</strong><span>{selected?.nivel_riesgo || '-'}</span></div></Modal>
  <ConfirmModal open={confirmOpen} title="Eliminar alerta" message="¿Deseas eliminar esta alerta?" onConfirm={handleDelete} onCancel={() => setConfirmOpen(false)} />
  </div>;
};

export default Alertas;
