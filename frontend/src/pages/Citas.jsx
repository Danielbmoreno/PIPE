import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import citasService from '../services/citasService.js';
import Loader from '../components/ui/Loader.jsx';
import Modal from '../components/modals/Modal.jsx';
import ConfirmModal from '../components/modals/ConfirmModal.jsx';

const initialForm = { estudiante_id: '', usuario_id: '', fecha: '', hora: '', motivo: '', estado: '' };

const Citas = () => {
  const { searchQuery } = useOutletContext();
  const [citas, setCitas] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    const loadCitas = async () => {
      try {
        const response = await citasService.getAll();
        setCitas(response.data);
      } catch (err) {
        setError('No se pudieron cargar las citas.');
      } finally {
        setLoading(false);
      }
    };

    loadCitas();
  }, []);

  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    setFiltered(
      citas.filter((item) =>
        item.motivo.toLowerCase().includes(query) ||
        item.estado.toLowerCase().includes(query) ||
        (item.codigo_radicado || '').toLowerCase().includes(query) ||
        String(item.estudiante_id).includes(query)
      )
    );
  }, [citas, searchQuery]);

  const openCreate = () => {
    setSelected(null);
    setForm(initialForm);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setSelected(item);
    setForm({
      estudiante_id: item.estudiante_id,
      usuario_id: item.usuario_id,
      fecha: item.fecha,
      hora: item.hora,
      motivo: item.motivo,
      estado: item.estado
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
        const response = await citasService.update(selected.id, form);
        setCitas((prev) => prev.map((item) => (item.id === selected.id ? response.data : item)));
      } else {
        const response = await citasService.create(form);
        setCitas((prev) => [response.data, ...prev]);
      }
      closeModal();
    } catch (err) {
      setError('Error al guardar cita.');
    }
  };

  const askDelete = (item) => {
    setSelected(item);
    setConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await citasService.remove(selected.id);
      setCitas((prev) => prev.filter((item) => item.id !== selected.id));
      setConfirmOpen(false);
    } catch (err) {
      setError('No se pudo eliminar la cita.');
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="page-shell">
      <div className="page-header space-between">
        <div>
          <h1>Citas</h1>
          <p>Agenda y controla las citas entre consejeros y estudiantes.</p>
        </div>
        <button className="primary-button" onClick={openCreate}>Nueva cita</button>
      </div>

      {error && <div className="alert-box">{error}</div>}

      {filtered.length === 0 ? (
        <div className="empty-state">No hay citas disponibles.</div>
      ) : (
        <div className="table-card">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Estudiante</th>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Motivo</th>
                <th>Estado</th>
                <th className="actions-column">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id}>
                  <td>{item.codigo_radicado || item.id}</td>

                  <td>{item.estudiante_id}</td>
                  <td>{item.fecha}</td>
                  <td>{item.hora}</td>
                  <td>{item.motivo}</td>
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
        title={selected ? 'Editar cita' : 'Nueva cita'}
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
            Fecha
            <input type="date" name="fecha" value={form.fecha} onChange={handleChange} required />
          </label>
          <label>
            Hora
            <input type="time" name="hora" value={form.hora} onChange={handleChange} required />
          </label>
          <label>
            Motivo
            <input type="text" name="motivo" value={form.motivo} onChange={handleChange} required />
          </label>
          <label>
            Estado
            <input type="text" name="estado" value={form.estado} onChange={handleChange} required />
          </label>
        </form>
      </Modal>

      <ConfirmModal
        open={confirmOpen}
        title="Eliminar cita"
        message="¿Deseas eliminar esta cita?"
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
};

export default Citas;
