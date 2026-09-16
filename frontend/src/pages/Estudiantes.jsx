import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import estudiantesService from '../services/estudiantesService.js';
import catalogService from '../services/catalogService.js';
import Loader from '../components/ui/Loader.jsx';
import Modal from '../components/modals/Modal.jsx';
import ConfirmModal from '../components/modals/ConfirmModal.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import { useToast } from '../components/ui/ToastContext.jsx';

const initialForm = { nombre: '', codigo: '', programa_id: '', nivel_riesgo: '' };
const riskLevels = ['bajo', 'medio', 'alto', 'critico'];

const getBadgeClass = (level) => {
  const value = String(level || '').toLowerCase();
  if (value.includes('crit')) return 'badge badge-critical';
  if (value.includes('alto')) return 'badge badge-high';
  if (value.includes('medio')) return 'badge badge-medium';
  return 'badge badge-low';
};

const Estudiantes = () => {
  const { searchQuery = '' } = useOutletContext() || {};
  const { showToast } = useToast();
  const { user } = useAuth();
  const [estudiantes, setEstudiantes] = useState([]);
  const [programas, setProgramas] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const loadData = async () => {
    setLoading(true);
    try {
      const [studentsResponse, programsResponse] = await Promise.all([
        estudiantesService.getAll(),
        catalogService.getPrograms()
      ]);
      if (!studentsResponse.success) throw new Error(studentsResponse.error || 'No se pudieron cargar los estudiantes.');
      if (!programsResponse.success) throw new Error(programsResponse.error || 'No se pudieron cargar los programas.');
      setEstudiantes(studentsResponse.data || []);
      setProgramas(programsResponse.data || []);
      setError('');
    } catch (err) {
      console.error('Error cargando estudiantes:', err);
      setError(err.message || 'No se pudieron cargar los estudiantes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    const query = String(searchQuery).trim().toLowerCase();
    setPage(1);
    setFiltered(estudiantes.filter((item) => [item.nombre, item.codigo, item.nivel_riesgo]
      .some((value) => String(value || '').toLowerCase().includes(query))));
  }, [estudiantes, searchQuery]);

  const programName = (programId) => programas.find((item) => String(item.id) === String(programId))?.nombre || 'Sin programa';
  const openCreate = () => { setSelected(null); setForm(initialForm); setModalOpen(true); };
  const openEdit = (student) => {
    setSelected(student);
    setForm({ nombre: student.nombre || '', codigo: student.codigo || '', programa_id: student.programa_id || '', nivel_riesgo: student.nivel_riesgo || '' });
    setModalOpen(true);
  };
  const openDetail = (student) => { setSelected(student); setDetailOpen(true); };
  const handleChange = (event) => setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        nombre: form.nombre.trim(),
        codigo: form.codigo.trim(),
        programa_id: form.programa_id ? Number(form.programa_id) : null,
        nivel_riesgo: form.nivel_riesgo
      };
      const response = selected
        ? await estudiantesService.update(selected.id, payload)
        : await estudiantesService.create(payload);
      if (!response.success) throw new Error(response.error || 'No se pudo guardar el estudiante.');
      setEstudiantes((previous) => selected
        ? previous.map((item) => item.id === selected.id ? response.data : item)
        : [response.data, ...previous]);
      setModalOpen(false);
      showToast(selected ? 'Estudiante actualizado.' : 'Estudiante creado.', 'success');
    } catch (err) {
      console.error('Error guardando estudiante:', err);
      showToast(err.message || 'No se pudo guardar el estudiante.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    const response = await estudiantesService.remove(selected.id);
    if (!response.success) {
      console.error('Error eliminando estudiante:', response.error);
      showToast(response.error || 'No se pudo eliminar el estudiante.', 'error');
      return;
    }
    setEstudiantes((previous) => previous.filter((item) => item.id !== selected.id));
    setConfirmOpen(false);
    showToast('Estudiante eliminado.', 'success');
  };

  if (loading) return <Loader />;
  const currentPageData = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  return (
    <div className="page-shell">
      <div className="page-header space-between">
        <div><h1>Estudiantes</h1><p>Gestiona el registro de estudiantes y su información académica.</p></div>
        {['admin', 'consejero'].includes(user?.rol_id) && <button className="primary-button" onClick={openCreate}>Nuevo estudiante</button>}
      </div>
      {error && <div className="alert-box">{error}</div>}
      {filtered.length === 0 ? <div className="empty-state">No hay estudiantes disponibles.</div> : (
        <><div className="table-card"><table><thead><tr><th>Nombre</th><th>Código</th><th>Programa</th><th>Nivel de riesgo</th><th className="actions-column">Acciones</th></tr></thead><tbody>{currentPageData.map((item) => <tr key={item.id}><td>{item.nombre || 'Sin nombre'}</td><td>{item.codigo || 'Sin código'}</td><td>{programName(item.programa_id)}</td><td><span className={getBadgeClass(item.nivel_riesgo)}>{item.nivel_riesgo || 'Sin nivel'}</span></td><td className="actions-column"><button className="secondary-button" onClick={() => openDetail(item)}>Ver</button>{['admin', 'consejero'].includes(user?.rol_id) && <><button className="secondary-button" onClick={() => openEdit(item)}>Editar</button><button className="danger-button" onClick={() => { setSelected(item); setConfirmOpen(true); }}>Eliminar</button></>}</td></tr>)}</tbody></table></div><Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} /></>
      )}
      <Modal title={selected ? 'Editar estudiante' : 'Nuevo estudiante'} open={modalOpen} onClose={() => setModalOpen(false)} footer={<div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setModalOpen(false)}>Cancelar</button><button type="submit" form="student-form" className="primary-button" disabled={saving}>{selected ? 'Actualizar' : 'Crear'}</button></div>}>
        <form id="student-form" className="form-grid" onSubmit={handleSubmit}><label>Nombre<input type="text" name="nombre" value={form.nombre} onChange={handleChange} required /></label><label>Código<input type="text" name="codigo" value={form.codigo} onChange={handleChange} required /></label><label>Programa<select name="programa_id" value={form.programa_id} onChange={handleChange} required><option value="">Seleccionar programa</option>{programas.map((programa) => <option key={programa.id} value={programa.id}>{programa.nombre}</option>)}</select></label><label>Nivel de riesgo<select name="nivel_riesgo" value={form.nivel_riesgo} onChange={handleChange} required><option value="">Seleccionar nivel</option>{riskLevels.map((level) => <option key={level} value={level}>{level[0].toUpperCase() + level.slice(1)}</option>)}</select></label></form>
      </Modal>
      <Modal title="Detalle del estudiante" open={detailOpen} onClose={() => setDetailOpen(false)} footer={<button className="secondary-button" onClick={() => setDetailOpen(false)}>Cerrar</button>}><div className="profile-item"><strong>Nombre</strong><span>{selected?.nombre || '-'}</span></div><div className="profile-item"><strong>Código</strong><span>{selected?.codigo || '-'}</span></div><div className="profile-item"><strong>Programa</strong><span>{selected ? programName(selected.programa_id) : '-'}</span></div><div className="profile-item"><strong>Nivel de riesgo</strong><span>{selected?.nivel_riesgo || '-'}</span></div></Modal>
      <ConfirmModal open={confirmOpen} title="Eliminar estudiante" message="¿Quieres eliminar este estudiante?" onConfirm={handleDelete} onCancel={() => setConfirmOpen(false)} />
    </div>
  );
};

export default Estudiantes;
