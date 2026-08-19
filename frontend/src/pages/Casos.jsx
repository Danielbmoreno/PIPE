import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import casosService from '../services/casosService.js';
import estudiantesService from '../services/estudiantesService.js';
import Loader from '../components/ui/Loader.jsx';
import Modal from '../components/modals/Modal.jsx';
import ConfirmModal from '../components/modals/ConfirmModal.jsx';

const initialForm = { estudiante_id: '', usuario_id: '', descripcion: '', estado: '' };

const Casos = () => {
  const { searchQuery } = useOutletContext();
  const [casos, setCasos] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    const loadCasos = async () => {
      try {
        const response = await casosService.getAll();
        setCasos(response.data);
      } catch (err) {
        setError('No se pudieron cargar los casos.');
      } finally {
        setLoading(false);
      }
    };

    loadCasos();
  }, []);

  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    setFiltered(
      casos.filter((item) =>
        item.descripcion.toLowerCase().includes(query) ||
        item.estado.toLowerCase().includes(query) ||
        (item.codigo_radicado || '').toLowerCase().includes(query) ||
        String(item.estudiante_id).includes(query)
      )
    );
  }, [casos, searchQuery]);

  const openCreate = () => {
    setSelected(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  const openEdit = (caso) => {
    setSelected(caso);
    setForm({
      estudiante_id: caso.estudiante_id,
      usuario_id: caso.usuario_id,
      descripcion: caso.descripcion,
      estado: caso.estado
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
        const response = await casosService.update(selected.id, form);
        setCasos((prev) => prev.map((item) => (item.id === selected.id ? response.data : item)));
      } else {
        const response = await casosService.create(form);
        setCasos((prev) => [response.data, ...prev]);
      }
      closeModal();
    } catch (err) {
      setError('Error al guardar caso.');
    }
  };

  const askDelete = (caso) => {
    setSelected(caso);
    setConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await casosService.remove(selected.id);
      setCasos((prev) => prev.filter((item) => item.id !== selected.id));
      setConfirmOpen(false);
    } catch (err) {
      setError('No se pudo eliminar el caso.');
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="page-shell">
      <div className="page-header space-between">
        <div>
          <h1>Casos</h1>
          <p>Registra y administra los casos de seguimiento estudiantil.</p>
        </div>
        <button className="primary-button" onClick={openCreate}>Nuevo caso</button>
      </div>

      {error && <div className="alert-box">{error}</div>}

      {filtered.length === 0 ? (
        <div className="empty-state">No hay casos disponibles.</div>
      ) : (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Estudiante</th>
                <th>Usuario</th>
                <th>Descripción</th>
                <th>Estado</th>
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
                  <td>{item.estado}</td>
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
        title={selected ? 'Editar caso' : 'Nuevo caso'}
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
            Estado
            <input type="text" name="estado" value={form.estado} onChange={handleChange} required />
          </label>
        </form>
      </Modal>

      <ConfirmModal
        open={confirmOpen}
        title="Eliminar caso"
        message="¿Deseas eliminar este caso?"
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};

export default Casos;
