import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import estudiantesService from '../services/estudiantesService.js';
import catalogService from '../services/catalogService.js';
import { Motivation } from '../components/ui/AccompanimentWidgets.jsx';
import { isInstitutionalEmail } from '../lib/institutionalEmail.js';
import { getRepository } from '../services/supabaseService.js';
import Loader from '../components/ui/Loader.jsx';
import Modal from '../components/modals/Modal.jsx';
import ConfirmModal from '../components/modals/ConfirmModal.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import { useToast } from '../components/ui/ToastContext.jsx';

const initialForm = { nombre: '', codigo: '', programa_id: '', nivel_riesgo: '', correo: '', password: '', confirmPassword: '', correo_verificado: false, semestre: '', estado: '', rendimiento_resumen: '', estado_acompanamiento: '' };
const riskLevels = ['bajo', 'medio', 'alto', 'critico'];

const getBadgeClass = (level) => {
  const value = String(level || '').toLowerCase();
  if (!value) return 'badge';
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
  const [formError, setFormError] = useState('');
  const [accountError, setAccountError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [accountStudent, setAccountStudent] = useState(null);
  const [staffAccount, setStaffAccount] = useState(false);
  const [staffProfiles, setStaffProfiles] = useState([]);
  const [staffId, setStaffId] = useState('');
  const [accountForm, setAccountForm] = useState({ correo: '', password: '', confirmPassword: '', correo_verificado: false });
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
  const openCreate = () => { setSelected(null); setForm(initialForm); setFormError(''); setModalOpen(true); };
  const openEdit = (student) => {
    setFormError('');
    setSelected(student);
    setForm({ nombre: student.nombre || '', codigo: student.codigo || '', programa_id: student.programa_id || '', nivel_riesgo: student.nivel_riesgo || '', semestre: student.semestre || '', estado: student.estado || '', rendimiento_resumen: student.rendimiento_resumen || '', estado_acompanamiento: student.estado_acompanamiento || '' });
    setModalOpen(true);
  };
  const openDetail = (student) => { setSelected(student); setDetailOpen(true); };
  const handleChange = (event) => setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      if (!selected && (!form.nombre.trim() || !form.programa_id)) {
        throw new Error('Indica nombre y programa. No completes código o riesgo sin confirmarlos.');
      }
      const payload = {
        nombre: form.nombre.trim(),
        codigo: form.codigo.trim() || null,
        programa_id: form.programa_id ? Number(form.programa_id) : null,
        nivel_riesgo: form.nivel_riesgo || null,
        ...(selected ? { semestre: form.semestre ? Number(form.semestre) : null, estado: form.estado.trim() || null, rendimiento_resumen: form.rendimiento_resumen.trim() || null, estado_acompanamiento: form.estado_acompanamiento.trim() || null } : {})
      };
      let response;
      if (selected) {
        response = await estudiantesService.update(selected.id, payload);
      } else {
        const email = form.correo.trim().toLowerCase();
        if (!isInstitutionalEmail(email)) throw new Error('Ingresa un correo institucional válido (.edu o .edu.co).');
        if (!form.password || form.password.length < 12) throw new Error('La contraseña individual inicial debe tener al menos 12 caracteres.');
        if (form.password !== form.confirmPassword) throw new Error('Las contraseñas no coinciden.');
        if (!form.correo_verificado) throw new Error('Confirma primero que el correo pertenece al estudiante.');
        response = await estudiantesService.create({ ...payload, correo: email, password: form.password, correo_verificado: true });
      }
      if (!response.success) throw new Error(response.error || 'No se pudo guardar el estudiante.');
      const savedStudent = selected ? response.data : response.data?.estudiante;
      setEstudiantes((previous) => selected
        ? previous.map((item) => item.id === selected.id ? savedStudent : item)
        : [savedStudent, ...previous]);
      setForm(initialForm);
      setSelected(null);
      setModalOpen(false);
      window.dispatchEvent(new Event('pipe:students-changed'));
      showToast(selected ? 'Estudiante actualizado.' : 'Estudiante creado correctamente. La cuenta ya puede iniciar sesión.', 'success');
    } catch (err) {
      console.error('Error guardando estudiante:', err);
      setFormError(err.message || 'No se pudo guardar el estudiante.');
      showToast(err.message || 'No se pudo guardar el estudiante.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const createAccount = async (event) => {
    event.preventDefault(); setAccountError(''); setSaving(true);
    try {
      if (!isInstitutionalEmail(accountForm.correo)) throw new Error('Indica el correo institucional real de la persona.');
      if (accountForm.password.length < 12 || accountForm.password !== accountForm.confirmPassword) throw new Error('Usa una contraseña individual de al menos 12 caracteres y confirma que coincida.');
      if (!accountForm.correo_verificado) throw new Error('Confirma la identidad y el correo antes de continuar.');
      if (staffAccount && !staffId) throw new Error('Selecciona el perfil de consejería aprobado.');
      const response = await estudiantesService.create({ ...(staffAccount ? { perfil_id: Number(staffId) } : { estudiante_id: accountStudent.id }), correo: accountForm.correo.trim().toLowerCase(), password: accountForm.password, correo_verificado: true });
      if (!response.success) throw new Error(response.error);
      if (!staffAccount) setEstudiantes((rows) => rows.map((r) => r.id === accountStudent.id ? response.data.estudiante : r));
      setStaffAccount(false);
      setAccountStudent(null); setAccountForm({ correo: '', password: '', confirmPassword: '', correo_verificado: false });
      window.dispatchEvent(new Event('pipe:students-changed')); showToast('Cuenta creada y vinculada a su registro institucional.', 'success');
    } catch (err) { setAccountError(err.message || 'No se pudo crear el acceso.'); }
    finally { setSaving(false); }
  };

  const openStaffAccount = async () => {
    setAccountError('');
    try {
      const scope = await getRepository().access();
      setStaffProfiles(scope.consejeros || []); setStaffId('');
      setAccountForm({ correo: '', password: '', confirmPassword: '', correo_verificado: false });
      setStaffAccount(true);
    } catch (err) { showToast(err.message, 'error'); }
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
    <div className="page-shell"><Motivation compact />
      <section className="admin-banner page-header space-between">
        <div><h1>Estudiantes</h1><p>Gestiona el registro de estudiantes y su información académica.</p></div>
        {user?.rol_id === 'admin' && <div className="pipe-agenda-actions"><button className="secondary-button" onClick={openStaffAccount}>Crear acceso de consejería</button><button className="primary-button" onClick={openCreate}>Nuevo estudiante</button></div>}
      </section>
      {error && <div className="alert-box">{error}</div>}
      {filtered.length === 0 ? <div className="empty-state">No hay estudiantes disponibles.</div> : (
        <><div className="table-card"><table><thead><tr><th>Nombre</th><th>Código</th><th>Programa</th><th>Nivel de riesgo</th><th className="actions-column">Acciones</th></tr></thead><tbody>{currentPageData.map((item) => <tr key={item.id}><td>{item.nombre || 'Sin nombre'}</td><td>{item.codigo || 'Sin código'}</td><td>{programName(item.programa_id)}</td><td><span className={getBadgeClass(item.nivel_riesgo)}>{item.nivel_riesgo || 'Sin nivel'}</span></td><td className="actions-column"><Link className="secondary-button" to={`/app/estudiantes/${item.id}`}>Expediente</Link><button className="secondary-button" onClick={() => openDetail(item)}>Resumen</button>{['admin', 'consejero'].includes(user?.rol_id) && <><button className="secondary-button" onClick={() => openEdit(item)}>Editar</button>{user.rol_id === 'admin' && <><button className="danger-button" onClick={() => { setSelected(item); setConfirmOpen(true); }}>Eliminar</button>{!item.usuario_id && <button className="secondary-button" onClick={() => { setAccountError(''); setAccountStudent(item); setAccountForm({ correo: item.correo || '', password: '', confirmPassword: '', correo_verificado: false }); }}>Crear acceso</button>}</>}</>}</td></tr>)}</tbody></table></div><Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} /></>
      )}
      <Modal title={selected ? 'Editar estudiante' : 'Nuevo estudiante'} open={modalOpen} onClose={() => setModalOpen(false)} footer={<div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setModalOpen(false)}>Cancelar</button><button type="submit" form="student-form" className="primary-button" disabled={saving}>{selected ? 'Actualizar' : 'Crear'}</button></div>}>
        {formError && <div className="alert-box" role="alert">{formError}</div>}<form id="student-form" className="form-grid" onSubmit={handleSubmit}><label>Nombre completo<input disabled={user.rol_id !== 'admin'} type="text" name="nombre" value={form.nombre} onChange={handleChange} required /></label><label>Código estudiantil<input disabled={user.rol_id !== 'admin'} type="text" name="codigo" value={form.codigo} onChange={handleChange} /></label><label>Programa<select disabled={user.rol_id !== 'admin'} name="programa_id" value={form.programa_id} onChange={handleChange} required={!selected}><option value="">Seleccionar programa</option>{programas.map((programa) => <option key={programa.id} value={programa.id}>{programa.nombre}</option>)}</select></label><label>Nivel de riesgo<select disabled={user.rol_id !== 'admin'} name="nivel_riesgo" value={form.nivel_riesgo} onChange={handleChange}><option value="">Seleccionar nivel</option>{riskLevels.map((level) => <option key={level} value={level}>{level[0].toUpperCase() + level.slice(1)}</option>)}</select></label>{selected && <><label>Semestre<input name="semestre" type="number" min="1" max="20" value={form.semestre} onChange={handleChange} /></label><label>Estado académico<input name="estado" value={form.estado} onChange={handleChange} maxLength={50} /></label><label>Proceso académico confirmado<input name="rendimiento_resumen" value={form.rendimiento_resumen} onChange={handleChange} maxLength={500} /></label><label>Estado de acompañamiento<input name="estado_acompanamiento" value={form.estado_acompanamiento} onChange={handleChange} maxLength={500} /></label></>}{!selected && <><label>Correo institucional<input type="email" name="correo" value={form.correo} onChange={handleChange} placeholder="estudiante@universidad.edu" required /></label><label>Contraseña inicial<input type="password" name="password" value={form.password} onChange={handleChange} minLength="12" required /></label><label>Confirmar contraseña<input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} minLength="12" required /></label><label className="pipe-account-consent"><input type="checkbox" checked={form.correo_verificado} onChange={(e) => setForm((f) => ({ ...f, correo_verificado: e.target.checked }))} required />He confirmado con la persona su identidad y el correo indicado.</label></>}</form>
      </Modal>
      <Modal title="Detalle del estudiante" open={detailOpen} onClose={() => setDetailOpen(false)} footer={<button className="secondary-button" onClick={() => setDetailOpen(false)}>Cerrar</button>}><div className="profile-item"><strong>Nombre</strong><span>{selected?.nombre || '-'}</span></div><div className="profile-item"><strong>Correo institucional</strong><span>{selected?.correo || 'Pendiente'}</span></div><div className="profile-item"><strong>Código</strong><span>{selected?.codigo || '-'}</span></div><div className="profile-item"><strong>Programa</strong><span>{selected ? programName(selected.programa_id) : '-'}</span></div><div className="profile-item"><strong>Nivel de riesgo</strong><span>{selected?.nivel_riesgo || '-'}</span></div></Modal>
      <Modal title={staffAccount ? 'Crear cuenta de consejería' : 'Crear cuenta del estudiante'} open={Boolean(accountStudent) || staffAccount} onClose={() => { setAccountStudent(null); setStaffAccount(false); }} footer={<button type="submit" form="student-account-form" className="primary-button" disabled={saving}>{saving ? 'Creando…' : 'Crear y vincular cuenta'}</button>}>{staffAccount ? <p>El nuevo acceso se vinculará al perfil de consejería aprobado. Las cuentas existentes conservarán sus credenciales.</p> : <p>El acceso se vinculará al expediente de {accountStudent?.nombre}. No se creará otro registro académico.</p>}{accountError && <div className="alert-box" role="alert">{accountError}</div>}<form id="student-account-form" className="form-grid" onSubmit={createAccount}>{staffAccount && <label>Perfil institucional de consejería<select value={staffId} onChange={(e) => { setStaffId(e.target.value); setAccountForm((f) => ({ ...f, correo: staffProfiles.find((p) => String(p.id) === e.target.value)?.correo || '', correo_verificado: false })); }} required><option value="">Seleccionar perfil aprobado</option>{staffProfiles.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></label>}<label>Correo institucional real<input type="email" value={accountForm.correo} autoComplete="off" onChange={(e) => setAccountForm((f) => ({ ...f, correo: e.target.value }))} required /></label><label>Contraseña individual inicial<input type="password" autoComplete="new-password" minLength={12} value={accountForm.password} onChange={(e) => setAccountForm((f) => ({ ...f, password: e.target.value }))} required /></label><label>Confirmar contraseña<input type="password" autoComplete="new-password" minLength={12} value={accountForm.confirmPassword} onChange={(e) => setAccountForm((f) => ({ ...f, confirmPassword: e.target.value }))} required /></label><label className="pipe-account-consent"><input type="checkbox" checked={accountForm.correo_verificado} onChange={(e) => setAccountForm((f) => ({ ...f, correo_verificado: e.target.checked }))} required />He confirmado con la persona su identidad y el correo indicado.</label></form></Modal>
      <ConfirmModal open={confirmOpen} title="Eliminar estudiante" message="¿Quieres eliminar este estudiante?" onConfirm={handleDelete} onCancel={() => setConfirmOpen(false)} />
    </div>
  );
};

export default Estudiantes;
