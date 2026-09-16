import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import citasService from '../services/citasService.js';
import Loader from '../components/ui/Loader.jsx';

const MisCitas = () => {
  const { user } = useAuth();
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const response = await citasService.getForStudent(user?.estudiante_id);
        if (!response.success) throw new Error(response.error || 'Error al cargar las citas');
        setCitas(response.data || []);
      } catch (err) { console.error('Mis citas:', err); setError('No se pudieron cargar tus citas.'); } finally { setLoading(false); }
    };
    if (user?.estudiante_id) load(); else setLoading(false);
  }, [user]);

  if (loading) return <Loader />;
  const upcoming = citas.filter((item) => item.fecha >= new Date().toISOString().slice(0, 10));
  const history = citas.filter((item) => !upcoming.includes(item));
  return <div className="page-shell student-page">
    <section className="small-student-banner"><div><span className="eyebrow">ORGANIZA TU CAMINO</span><h1>Mis citas</h1><p>Un espacio para cuidar tus tiempos y seguir avanzando.</p></div><span className="banner-symbol">▣</span></section>
    {error && <div className="alert-box">{error}</div>}
    <section className="student-card agenda-card"><div className="section-head"><div><span className="eyebrow">AGENDA PERSONAL</span><h2>Próximas citas</h2></div><span className="section-hint">{upcoming.length} programadas</span></div>{upcoming.length === 0 ? <div className="student-empty large-empty"><span>◷</span><strong>Tu agenda está libre por ahora.</strong><p>Las nuevas citas aparecerán automáticamente aquí.</p></div> : <div className="appointment-list">{upcoming.map((item) => { const date = new Date(`${item.fecha}T00:00:00`); return <article className="appointment-item" key={item.id}><div className="date-block"><strong>{date.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '').toUpperCase()}</strong><b>{date.getDate()}</b></div><div className="appointment-detail"><span className="appointment-time">{item.hora}</span><h3>Acompañamiento académico</h3><span className="soft-status">{item.estado || 'PROGRAMADA'}</span></div><span className="appointment-arrow">→</span></article>; })}</div>}</section>
    {history.length > 0 && <section className="student-card history-card"><div className="section-head"><h2>Historial de citas</h2><span className="section-hint">Tu recorrido</span></div><div className="history-list">{history.map((item) => <div key={item.id}><span className="history-dot" /><strong>{item.fecha}</strong><span>{item.estado || 'Cita registrada'}</span></div>)}</div></section>}
  </div>;
};

export default MisCitas;
