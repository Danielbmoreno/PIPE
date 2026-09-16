import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import estudiantesService from '../services/estudiantesService.js';
import catalogService from '../services/catalogService.js';
import citasService from '../services/citasService.js';
import Loader from '../components/ui/Loader.jsx';

const quotes = [
  'Cada paso cuenta.',
  'Tu proceso importa.',
  'Aprender también significa volver a intentarlo.',
  'Tu esfuerzo de hoy construye nuevas oportunidades.',
  'Avanzar poco también es avanzar.'
];

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [program, setProgram] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const quote = quotes[new Date().getDate() % quotes.length];

  useEffect(() => {
    const load = async () => {
      try {
        const studentResponse = await estudiantesService.getById(user?.estudiante_id);
        const appointmentsResponse = await citasService.getForStudent(user?.estudiante_id);
        if (!studentResponse.success) throw new Error(studentResponse.error || 'No se pudo cargar tu información.');
        if (!appointmentsResponse.success) throw new Error(appointmentsResponse.error || 'No se pudieron cargar tus citas.');
        const programsResponse = await catalogService.getPrograms();
        setStudent(studentResponse.data);
        setAppointments(appointmentsResponse.data || []);
        if (programsResponse.success) setProgram(programsResponse.data.find((item) => String(item.id) === String(studentResponse.data?.programa_id)));
      } catch (err) {
        console.error('Dashboard estudiante:', err);
        setError(err.message || 'No se pudo cargar tu dashboard.');
      } finally { setLoading(false); }
    };
    if (user?.estudiante_id) load();
    else setLoading(false);
  }, [user]);

  if (loading) return <Loader />;
  const nextAppointment = appointments.filter((item) => item.fecha && item.fecha >= new Date().toISOString().slice(0, 10)).sort((a, b) => `${a.fecha}${a.hora}`.localeCompare(`${b.fecha}${b.hora}`))[0];
  const displayName = student?.nombre || user?.nombre || 'Estudiante';
  const followUp = { bajo: 'Seguimiento estable', medio: 'Seguimiento preventivo', alto: 'Acompañamiento prioritario', critico: 'Acompañamiento prioritario' }[String(student?.nivel_riesgo || '').toLowerCase()] || 'Seguimiento en curso';

  return <div className="student-dashboard page-shell">
    {error && <div className="alert-box">{error}</div>}
    <section className="student-hero">
      <div className="hero-copy"><span className="eyebrow">TU ESPACIO DE ACOMPAÑAMIENTO</span><h1>¡Hola, {displayName.split(' ')[0]}!</h1><p>Cada paso cuenta. Sigue avanzando en tu proceso académico.</p><span className="hero-quote">{quote}</span><div className="hero-actions"><button className="primary-button" onClick={() => navigate('/app/mis-citas')}>Ver mis citas <span>→</span></button><button className="ghost-button" onClick={() => navigate('/app/profile')}>Mi perfil</button></div></div>
      <div className="hero-shape" aria-hidden="true"><div className="hero-sun" /><div className="hero-ring ring-one" /><div className="hero-ring ring-two" /><div className="hero-book">✦</div></div>
    </section>
    <div className="student-grid">
      <section className="next-appointment student-card"><div className="card-kicker"><span>◷</span> MI PRÓXIMA CITA</div>{nextAppointment ? <div className="appointment-highlight"><div className="date-block"><strong>{new Date(`${nextAppointment.fecha}T00:00:00`).toLocaleDateString('es-CO', { month: 'short' }).replace('.', '').toUpperCase()}</strong><b>{new Date(`${nextAppointment.fecha}T00:00:00`).getDate()}</b></div><div><h2>{nextAppointment.hora}</h2><p>Acompañamiento académico</p><span className="soft-status">{nextAppointment.estado || 'PROGRAMADA'}</span></div></div> : <div className="empty-appointment"><strong>Tu agenda está libre por ahora.</strong><p>Cuando tu equipo de acompañamiento programe una cita, aparecerá aquí.</p></div>}<button className="text-link" onClick={() => navigate('/app/mis-citas')}>Ver mis citas <span>→</span></button></section>
      <section className="student-card info-card"><div className="card-kicker"><span>◎</span> MI INFORMACIÓN</div><div className="info-row"><span>Programa</span><strong>{program?.nombre || 'Programa no definido'}</strong></div><div className="info-row"><span>Código</span><strong>{student?.codigo || '—'}</strong></div><div className="info-row"><span>Estado de seguimiento</span><strong className="stable"><i />{followUp}</strong></div></section>
    </div>
    <section className="support-banner"><div><span className="eyebrow">ESTAMOS PARA ACOMPAÑARTE</span><h2>Tu bienestar importa.</h2><p>PIPE te ayuda a mantener organizados tus procesos de seguimiento, citas y acompañamiento académico.</p></div><div className="support-illustration" aria-hidden="true"><span>◒</span><span>✦</span><span>◓</span></div></section>
    <div className="student-lower-grid"><section className="student-card"><div className="section-head"><h2>Accesos rápidos</h2><span className="section-hint">A tu ritmo</span></div><div className="quick-actions"><button onClick={() => navigate('/app/profile')}><span className="quick-icon yellow-icon">◎</span><strong>Mi perfil</strong><small>Consulta tu información académica.</small></button><button onClick={() => navigate('/app/mis-citas')}><span className="quick-icon blue-icon">▣</span><strong>Mis citas</strong><small>Revisa tus citas programadas.</small></button></div></section><section className="student-card activity-card"><div className="section-head"><h2>Actividad reciente</h2><span className="section-hint">Tu proceso</span></div>{appointments.length ? <div className="student-activity">{appointments.slice(0, 3).map((item) => <div key={item.id}><span className="activity-mark">◷</span><div><strong>Cita {String(item.estado || 'programada').toLowerCase()}</strong><small>{item.fecha} · {item.hora}</small></div></div>)}</div> : <p className="student-empty">Aún no tienes actividad reciente.</p>}</section></div>
  </div>;
};

export default StudentDashboard;
