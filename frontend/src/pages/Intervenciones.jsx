import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import intervencionesService from '../services/intervencionesService.js';
import catalogService from '../services/catalogService.js';
import Loader from '../components/ui/Loader.jsx';
import Modal from '../components/modals/Modal.jsx';
import ConfirmModal from '../components/modals/ConfirmModal.jsx';
import { useToast } from '../components/ui/ToastContext.jsx';

const initialForm = { caso_id: '', descripcion: '' };

const Intervenciones = () => {
  const { searchQuery = '' } = useOutletContext() || {};
  const { user } = useAuth();
  const { showToast } = useToast();
  const [intervenciones, setIntervenciones] = useState([]);
  const [casos, setCasos] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const caseName = (id) => { const item = casos.find((caso) => String(caso.id) === String(id)); return item ? `Caso #${item.id} - ${item.descripcion || 'Sin descripción'}` : `Caso #${id}`; };

  useEffect(() => {
    const load = async () => {
      try {
        const [interventionsResponse, casesResponse] = await Promise.all([intervencionesService.getAll(), catalogService.getCases()]);
        if (!interventionsResponse.success) throw new Error(interventionsResponse.error || 'No se pudieron cargar las intervenciones.');
        if (!casesResponse.success) throw new Error(casesResponse.error || 'No se pudieron cargar los casos.');
        setIntervenciones(interventionsResponse.data || []); setCasos(casesResponse.data || []);
      } catch (err) { console.error('Error cargando intervenciones:', err); setError(err.message || 'No se pudieron cargar las intervenciones.'); } finally { setLoading(false); }
    };
    load();
  }, []);
  useEffect(() => { const query = String(searchQuery).trim().toLowerCase(); setFiltered(intervenciones.filter((item) => [item.descripcion, caseName(item.caso_id)].some((value) => String(value || '').toLowerCase().includes(query)))); }, [intervenciones, casos, searchQuery]);
  const openCreate = () => { setSelected(null); setForm(initialForm); setModalOpen(true); };
  const openEdit = (item) => { setSelected(item); setForm({ caso_id: item.caso_id || '', descripcion: item.descripcion || '' }); setModalOpen(true); };
  const handleChange = (event) => setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  const handleSubmit = async (event) => { event.preventDefault(); setSaving(true); try { const payload = { caso_id: Number(form.caso_id), usuario_id: user.id, descripcion: form.descripcion.trim() }; const response = selected ? await intervencionesService.update(selected.id, payload) : await intervencionesService.create(payload); if (!response.success) throw new Error(response.error || 'No se pudo guardar la intervención.'); setIntervenciones((previous) => selected ? previous.map((item) => item.id === selected.id ? response.data : item) : [response.data, ...previous]); setModalOpen(false); showToast(selected ? 'Intervención actualizada.' : 'Intervención creada.', 'success'); } catch (err) { console.error('Error guardando intervención:', err); showToast(err.message || 'No se pudo guardar la intervención.', 'error'); } finally { setSaving(false); } };
  const handleDelete = async () => { if (!selected) return; const response = await intervencionesService.remove(selected.id); if (!response.success) { console.error('Error eliminando intervención:', response.error); showToast(response.error || 'No se pudo eliminar la intervención.', 'error'); return; } setIntervenciones((previous) => previous.filter((item) => item.id !== selected.id)); setConfirmOpen(false); showToast('Intervención eliminada.', 'success'); };
  if (loading) return <Loader />;
  return <div className="page-shell"><div className="page-header space-between"><div><h1>Intervenciones</h1><p>Gestiona las intervenciones asociadas a los casos de seguimiento.</p></div><button className="primary-button" onClick={openCreate}>Nueva intervención</button></div>{error && <div className="alert-box">{error}</div>}{filtered.length === 0 ? <div className="empty-state">No hay intervenciones disponibles.</div> : <div className="table-card"><table><thead><tr><th>Caso</th><th>Descripción</th><th>Fecha</th><th className="actions-column">Acciones</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td>{caseName(item.caso_id)}</td><td>{item.descripcion || '-'}</td><td>{item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}</td><td className="actions-column"><button className="secondary-button" onClick={() => { setSelected(item); setDetailOpen(true); }}>Ver</button><button className="secondary-button" onClick={() => openEdit(item)}>Editar</button><button className="danger-button" onClick={() => { setSelected(item); setConfirmOpen(true); }}>Eliminar</button></td></tr>)}</tbody></table></div>}
    <Modal title={selected ? 'Editar intervención' : 'Nueva intervención'} open={modalOpen} onClose={() => setModalOpen(false)} footer={<div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setModalOpen(false)}>Cancelar</button><button type="submit" form="intervention-form" className="primary-button" disabled={saving}>{selected ? 'Actualizar' : 'Crear'}</button></div>}><form id="intervention-form" className="form-grid" onSubmit={handleSubmit}><label>Caso<select name="caso_id" value={form.caso_id} onChange={handleChange} required><option value="">Seleccionar caso</option>{casos.map((caso) => <option key={caso.id} value={caso.id}>Caso #{caso.id} - {caso.descripcion || 'Sin descripción'}</option>)}</select></label><label>Descripción<input type="text" name="descripcion" value={form.descripcion} onChange={handleChange} required /></label></form></Modal>
    <Modal title="Detalle de intervención" open={detailOpen} onClose={() => setDetailOpen(false)} footer={<button className="secondary-button" onClick={() => setDetailOpen(false)}>Cerrar</button>}><div className="profile-item"><strong>Caso</strong><span>{selected ? caseName(selected.caso_id) : '-'}</span></div><div className="profile-item"><strong>Descripción</strong><span>{selected?.descripcion || '-'}</span></div></Modal><ConfirmModal open={confirmOpen} title="Eliminar intervención" message="¿Deseas eliminar esta intervención?" onConfirm={handleDelete} onCancel={() => setConfirmOpen(false)} /></div>;
};

export default Intervenciones;
