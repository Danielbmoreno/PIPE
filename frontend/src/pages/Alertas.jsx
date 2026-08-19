import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import alertasService from '../services/alertasService.js';
import estudiantesService from '../services/estudiantesService.js';
import Loader from '../components/ui/Loader.jsx';
import Modal from '../components/modals/Modal.jsx';
import ConfirmModal from '../components/modals/ConfirmModal.jsx';

const initialForm = { estudiante_id: '', usuario_id: '', descripcion: '', nivel_riesgo: '' };

const Alertas = () => {
  const { searchQuery } = useOutletContext();
  const [alertas, setAlertas] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    const load = async () => {
      try {
        const [alertasResp, estudiantesResp] = await Promise.all([
          alertasService.getAll(),
          estudiantesService.getAll()
        ]);
        setAlertas(alertasResp.data);
        setEstudiantes(estudiantesResp.data);
      } catch (err) {
        setError('No se pudieron cargar las alertas.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    setFiltered(
      alertas.filter((item) =>
        item.descripcion.toLowerCase().includes(query) ||
        item.nivel_riesgo.toLowerCase().includes(query) ||
        (item.codigo_radicado || '').toLowerCase().includes(query) ||
        String(item.estudiante_id).includes(query)
      )
    );
  }, [alertas, searchQuery]);

  const openCreate = () => {
    setSelected(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  const openEdit = (alerta) => {
    setSelected(alerta);
    setForm({
      estudiante_id: alerta.estudiante_id,
      usuario_id: alerta.usuario_id,
      descripcion: alerta.descripcion,
      nivel_riesgo: alerta.nivel_riesgo
    });
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (selected) {
        const response = await alertasService.update(selected.id, form);
        setAlertas((prev) => prev.map((item) => (item.id === selected.id ? response.data : item)));
      } else {
        const response = await alertasService.create(form);
        setAlertas((prev) => [response.data, ...prev]);
      }
      closeModal();
    } catch (err) {
      setError('Error al guardar alerta.');
    }
  };

  const askDelete = (alerta) => {
    setSelected(alerta);
    setConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await alertasService.remove(selected.id);
      setAlertas((prev) => prev.filter((item) => item.id !== selected.id));
      setConfirmOpen(false);
    } catch (err) {
      setError('No se pudo eliminar la alerta.');
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="page-shell">
      <div className="page-header space-between">
        <div>
          <h1>Alertas</h1>
          <p>Registra y administra alertas de seguimiento para estudiantes.</p>
        </div>
        <button className="primary-button" onClick={openCreate}>Nueva alerta</button>
      </div>

      {error && <div className="alert-box">{error}</div>}

      {filtered.length === 0 ? (
        <div className="empty-state">No hay alertas disponibles.</div>
      ) : (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Estudiante</th>
                <th>Usuario</th>
                <th>Descripción</th>
                <th>Nivel</th>
                <th className="actions-column">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td>{item.codigo_radicado || item.id}</td>

                  <td>{item.estudiante_id}</td>
                  <td>{item.usuario_id}</td>
                  <td>{item.descripcion}</td>
                  <td>{item.nivel_riesgo}</td>
                  <td className="actions-column">
                    <button className="secondary-button" onClick={() => openEdit(item)}>Editar</button>
                    <button className="danger-button" onClick={() => askDelete(item)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        title={selected ? 'Editar alerta' : 'Nueva alerta'}
        open={modalOpen}
        onClose={closeModal}
        footer={
          <div className="modal-actions">
            <button className="secondary-button" onClick={closeModal}>Cancelar</button>
            <button className="primary-button" onClick={handleSubmit}>{selected ? 'Actualizar' : 'Crear'}</button>
          </div>
        }
      >
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Estudiante ID
            <input type="number" name="estudiante_id" value={form.estudiante_id} onChange={handleChange} required />
          </label>
          <label>
            Usuario ID
            <input type="number" name="usuario_id" value={form.usuario_id} onChange={handleChange} required />
          </label>
          <label>
            Descripción
            <input type="text" name="descripcion" value={form.descripcion} onChange={handleChange} required />
          </label>
          <label>
            Nivel de riesgo
            <input type="text" name="nivel_riesgo" value={form.nivel_riesgo} onChange={handleChange} required />
          </label>
        </form>
      </Modal>

      <ConfirmModal
        open={confirmOpen}
        title="Eliminar alerta"
        message="¿Deseas eliminar esta alerta?"
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};

export default Alertas;
