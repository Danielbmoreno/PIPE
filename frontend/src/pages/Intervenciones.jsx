import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import intervencionesService from '../services/intervencionesService.js';
import casosService from '../services/casosService.js';
import Loader from '../components/ui/Loader.jsx';
import Modal from '../components/modals/Modal.jsx';
import ConfirmModal from '../components/modals/ConfirmModal.jsx';

const initialForm = { caso_id: '', usuario_id: '', descripcion: '' };

const Intervenciones = () => {
  const { searchQuery } = useOutletContext();
  const [intervenciones, setIntervenciones] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await intervencionesService.getAll();
        setIntervenciones(response.data);
      } catch (err) {
        setError('No se pudieron cargar las intervenciones.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    setFiltered(
      intervenciones.filter((item) =>
        item.descripcion.toLowerCase().includes(query) ||
        String(item.caso_id).includes(query)
      )
    );
  }, [intervenciones, searchQuery]);

  const openCreate = () => {
    setSelected(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setSelected(item);
    setForm({ caso_id: item.caso_id, usuario_id: item.usuario_id, descripcion: item.descripcion });
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
        const response = await intervencionesService.update(selected.id, form);
        setIntervenciones((prev) => prev.map((item) => (item.id === selected.id ? response.data : item)));
      } else {
        const response = await intervencionesService.create(form);
        setIntervenciones((prev) => [response.data, ...prev]);
      }
      closeModal();
    } catch (err) {
      setError('Error al guardar intervención.');
    }
  };

  const askDelete = (item) => {
    setSelected(item);
    setConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await intervencionesService.remove(selected.id);
      setIntervenciones((prev) => prev.filter((item) => item.id !== selected.id));
      setConfirmOpen(false);
    } catch (err) {
      setError('No se pudo eliminar la intervención.');
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="page-shell">
      <div className="page-header space-between">
        <div>
          <h1>Intervenciones</h1>
          <p>Gestiona las intervenciones asociadas a los casos de seguimiento.</p>
        </div>
        <button className="primary-button" onClick={openCreate}>Nueva intervención</button>
      </div>

      {error && <div className="alert-box">{error}</div>}

      {filtered.length === 0 ? (
        <div className="empty-state">No hay intervenciones disponibles.</div>
      ) : (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Caso</th>
                <th>Usuario</th>
                <th>Descripción</th>
                <th className="actions-column">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.caso_id}</td>
                  <td>{item.usuario_id}</td>
                  <td>{item.descripcion}</td>
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
        title={selected ? 'Editar intervención' : 'Nueva intervención'}
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
            Caso ID
            <input type="number" name="caso_id" value={form.caso_id} onChange={handleChange} required />
          </label>
          <label>
            Usuario ID
            <input type="number" name="usuario_id" value={form.usuario_id} onChange={handleChange} required />
          </label>
          <label>
            Descripción
            <input type="text" name="descripcion" value={form.descripcion} onChange={handleChange} required />
          </label>
        </form>
      </Modal>

      <ConfirmModal
        open={confirmOpen}
        title="Eliminar intervención"
        message="¿Deseas eliminar esta intervención?"
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};

export default Intervenciones;
