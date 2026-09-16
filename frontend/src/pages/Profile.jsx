import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import estudiantesService from '../services/estudiantesService.js';
import catalogService from '../services/catalogService.js';
import Loader from '../components/ui/Loader.jsx';

const Profile = () => {
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);
  const initials = String(user?.nombre || 'U').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  useEffect(() => {
    const load = async () => {
      if (!user?.estudiante_id) { setLoading(false); return; }
      const [studentResponse, programsResponse] = await Promise.all([estudiantesService.getById(user.estudiante_id), catalogService.getPrograms()]);
      if (studentResponse.success) setStudent(studentResponse.data);
      if (programsResponse.success) setProgram(programsResponse.data.find((item) => String(item.id) === String(studentResponse.data?.programa_id)));
      setLoading(false);
    };
    load().catch((error) => { console.error('Perfil estudiante:', error); setLoading(false); });
  }, [user]);

  if (loading) return <Loader />;
  const followUp = { bajo: 'Seguimiento estable', medio: 'Seguimiento preventivo', alto: 'Acompañamiento prioritario', critico: 'Acompañamiento prioritario' }[String(student?.nivel_riesgo || '').toLowerCase()] || 'Seguimiento en curso';

  return <div className="page-shell student-page">
    <section className="profile-hero"><div className="avatar avatar-large">{initials}</div><div><span className="eyebrow">MI ESPACIO</span><h1>{user?.nombre || 'Mi perfil'}</h1><p>{program?.nombre || 'Información académica'} · {user?.rol_id?.toUpperCase()}</p></div><span className="profile-spark">✦</span></section>
    <div className="profile-grid modern-profile-grid"><section className="profile-card"><div className="card-kicker">◎ INFORMACIÓN PERSONAL</div><div className="profile-item"><strong>Nombre</strong><span>{user?.nombre || '-'}</span></div><div className="profile-item"><strong>Correo institucional</strong><span>{user?.correo || '-'}</span></div></section><section className="profile-card"><div className="card-kicker">▣ INFORMACIÓN ACADÉMICA</div><div className="profile-item"><strong>Código</strong><span>{student?.codigo || '-'}</span></div><div className="profile-item"><strong>Programa</strong><span>{program?.nombre || '-'}</span></div><div className="profile-item"><strong>Estado de seguimiento</strong><span className="stable"><i />{followUp}</span></div></section></div>
    <section className="profile-card account-card"><div className="card-kicker">◌ CUENTA</div><div className="account-items"><div><strong>Rol</strong><span>{user?.rol_id?.toUpperCase() || '-'}</span></div><div><strong>Estado</strong><span className="stable"><i />Activo</span></div></div></section>
    <section className="profile-note-banner"><span>✦</span><p>Tu información académica forma parte de tu proceso de acompañamiento.</p></section>
  </div>;
};

export default Profile;
