import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import estudiantesService from '../services/estudiantesService.js';
import Loader from '../components/ui/Loader.jsx';
import Modal from '../components/modals/Modal.jsx';
import ConfirmModal from '../components/modals/ConfirmModal.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import { useToast } from '../components/ui/ToastContext.jsx';

const initialForm = { nombre: '', codigo: '', programa: '', semestre: '', nivel_riesgo: '', correo: '', password: '' };
const riskLevels = ['bajo', 'medio', 'alto', 'critico'];

const getBadgeClass = (level) => {
  const value = String(level || '').toLowerCase();
  if (value.includes('crit')) return 'badge badge-critical';
  if (value.includes('alto')) return 'badge badge-high';
  if (value.includes('medio')) return 'badge badge-medium';
  return 'badge badge-low';
};

const Estudiantes = () => {
  const { searchQuery } = useOutletContext();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [estudiantes, setEstudiantes] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const loadEstudiantes = async () => {
      try {
        const response = await estudiantesService.getAll();
        if (!response.success) {
          throw new Error(response.error || 'No se pudieron cargar los estudiantes.');
        }
        setEstudiantes(response.data || []);
      } catch (err) {
        console.error(err);
        setError('No se pudieron cargar los estudiantes.');
      } finally {
        setLoading(false);
      }
    };

    loadEstudiantes();
  }, []);

  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    setPage(1);
    setFiltered(
      estudiantes.filter((item) =>
        item.nombre.toLowerCase().includes(query) ||
        (item.codigo_radicado || '').toLowerCase().includes(query) ||
        item.codigo.toLowerCase().includes(query) ||
        item.programa.toLowerCase().includes(query)
      )
    );
  }, [estudiantes, searchQuery]);

  const openCreate = () => {
    setSelected(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  const openEdit = (estudiante) => {
    setSelected(estudiante);
    setForm({
      nombre: estudiante.nombre || '',
      codigo: estudiante.codigo || '',
      programa: estudiante.programa || '',
      semestre: estudiante.semestre || '',
      nivel_riesgo: estudiante.nivel_riesgo || ''
    });
    setModalOpen(true);
  };

  const openDetail = async (estudiante) => {
    setDetailData(null);
    setDetailOpen(true);
    try {
      const response = await estudiantesService.getById(estudiante.id);
      if (!response.success) {
        throw new Error(response.error || 'No se pudo cargar el detalle del estudiante');
      }
      setDetailData(response.data);
    } catch (err) {
      console.error(err);
      setError('No se pudo cargar el detalle del estudiante.');
    }
  };

  const closeModal = () => setModalOpen(false);
  const closeDetail = () => setDetailOpen(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (selected) {
        const response = await estudiantesService.update(selected.id, form);
        if (!response.success) throw new Error(response.error || 'Error al actualizar estudiante.');
        setEstudiantes((prev) => prev.map((item) => (item.id === selected.id ? response.data : item)));
        showToast('Estudiante actualizado.', 'success');
      } else {
        const payload = { ...form };
        const response = await estudiantesService.create(payload);
        if (!response.success) throw new Error(response.error || 'Error al crear estudiante.');
        setEstudiantes((prev) => [response.data, ...prev]);
        if (response.data?.plain_password) {
          showToast(`Estudiante creado. Contraseña: ${response.data.plain_password}`, 'success');
        } else {
          showToast('Estudiante creado.', 'success');
        }
      }
      closeModal();
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Error al guardar estudiante.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const askDelete = (estudiante) => {
    setSelected(estudiante);
    setConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      const response = await estudiantesService.remove(selected.id);
      if (!response.success) throw new Error(response.error || 'No se pudo eliminar el estudiante.');
      setEstudiantes((prev) => prev.filter((item) => item.id !== selected.id));
      setConfirmOpen(false);
      showToast('Estudiante eliminado.', 'success');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'No se pudo eliminar el estudiante.', 'error');
    }
  };

  const currentPageData = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  if (loading) return <Loader />;

  return (
    <div className="page-shell">
      <div className="page-header space-between">
        <div>
          <h1>Estudiantes</h1>
          <p>Gestiona el registro de estudiantes y su información académica.</p>
        </div>
        {['admin','consejero'].includes(user?.rol_id) ? (
          <button className="primary-button" onClick={openCreate}>Nuevo estudiante</button>
        ) : (
          <div style={{ color: 'var(--text-muted)' }}>No tienes permiso para crear estudiantes</div>
        )}
      </div>

      {error && <div className="alert-box">{error}</div>}

      {filtered.length === 0 ? (
        <div className="empty-state">No hay estudiantes disponibles.</div>
      ) : (
        <>
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>Radicado</th>
                  <th>Nombre</th>
                  <th>Código</th>
                  <th>Código radicado</th>
                  <th>Programa</th>
                  <th>Semestre</th>
                  <th>Nivel de riesgo</th>
                  <th className="actions-column">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {currentPageData.map((item) => (
                  <tr key={item.id}>
                    <td>{item.codigo_radicado || 'N/A'}</td>
                    <td>{item.nombre}</td>
                    <td>{item.codigo}</td>
                    <td>{item.codigo_radicado || 'N/A'}</td>
                    <td>{item.programa}</td>

                    <td>{item.semestre}</td>
                    <td><span className={getBadgeClass(item.nivel_riesgo)}>{item.nivel_riesgo || 'n/a'}</span></td>
                    <td className="actions-column">
                      <button className="secondary-button" onClick={() => openDetail(item)}>Ver</button>
                      {['admin','consejero'].includes(user?.rol_id) ? (
                        <>
                          <button className="secondary-button" onClick={() => openEdit(item)}>Editar</button>
                          <button className="danger-button" onClick={() => askDelete(item)}>Eliminar</button>
                        </>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={(nextPage) => setPage(nextPage)} />
        </>
      )}

      <Modal
        title={selected ? 'Editar estudiante' : 'Nuevo estudiante'}
        open={modalOpen}
        onClose={closeModal}
        footer={
          <div className="modal-actions">
            <button className="secondary-button" onClick={closeModal}>Cancelar</button>
            <button className="primary-button" onClick={handleSubmit} disabled={saving}>{selected ? 'Actualizar' : 'Crear'}</button>
          </div>
        }
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Nombre
            <input type="text" name="nombre" value={form.nombre} onChange={handleChange} required />
          </label>
          <label>
            Código
            <input type="text" name="codigo" value={form.codigo} onChange={handleChange} required />
          </label>
          <label>
            Programa
            <input type="text" name="programa" value={form.programa} onChange={handleChange} required />
          </label>
          <label>
            Semestre
            <input type="number" name="semestre" value={form.semestre} onChange={handleChange} required />
          </label>
          <label>
            Nivel de riesgo
            <select name="nivel_riesgo" value={form.nivel_riesgo} onChange={handleChange} required>
              <option value="">Seleccionar nivel</option>
              {riskLevels.map((level) => (
                <option value={level} key={level}>{level}</option>
              ))}
            </select>
          </label>
          <hr />
          <h3>Datos de acceso</h3>
          <label>
            Correo institucional
            <input type="email" name="correo" value={form.correo} onChange={handleChange} placeholder="usuario@universidad.edu" required />
          </label>
          <label>
            Contraseña (opcional, se generará si se deja vacío)
            <input type="text" name="password" value={form.password} onChange={handleChange} placeholder="Generar si vacío" />
          </label>
        </form>
      </Modal>

      <Modal
        title="Detalle del estudiante"
        open={detailOpen}
        onClose={closeDetail}
        footer={
          <div className="modal-actions">
            <button className="secondary-button" onClick={closeDetail}>Cerrar</button>
          </div>
        }
      >
        {detailData ? (
          <div className="detail-grid">
            <div>
              <strong>Código radicado:</strong>
              <p>{detailData.codigo_radicado || 'N/A'}</p>
            </div>
            <div>
              <strong>Nombre:</strong>
              <p>{detailData.nombre}</p>
            </div>
            <div>
              <strong>Código:</strong>
              <p>{detailData.codigo}</p>
            </div>
            <div>
              <strong>Programa:</strong>
              <p>{detailData.programa}</p>
            </div>
            <div>
              <strong>Semestre:</strong>
              <p>{detailData.semestre}</p>
            </div>
            <div>
              <strong>Nivel de riesgo:</strong>
              <p>{detailData.nivel_riesgo || 'n/a'}</p>
            </div>
            <div>
              <strong>Riesgo calculado:</strong>
              <p>{detailData.risk?.nivel_riesgo_calculado || 'n/a'}</p>
            </div>
            <div>
              <strong>Alertas:</strong>
              <p>{detailData.alertas?.length ?? 0}</p>
            </div>
            <div>
              <strong>Casos:</strong>
              <p>{detailData.casos?.length ?? 0}</p>
            </div>
            <div>
              <strong>Citas:</strong>
              <p>{detailData.citas?.length ?? 0}</p>
            </div>
            <div>
              <strong>Intervenciones:</strong>
              <p>{detailData.intervenciones?.length ?? 0}</p>
            </div>
          </div>
        ) : (
          <Loader />
        )}
      </Modal>

      <ConfirmModal
        open={confirmOpen}
        title="Eliminar estudiante"
        message="¿Quieres eliminar este estudiante? Esta acción no se puede deshacer."
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};

export default Estudiantes;
