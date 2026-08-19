import { useAuth } from '../contexts/AuthContext.jsx';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1>Mi perfil</h1>
          <p>Detalle de tu cuenta y estado dentro de PIPE.</p>
        </div>
      </div>

      <div className="profile-grid">
        <section className="profile-card">
          <h2>Información personal</h2>
          <div className="profile-item">
            <strong>Nombre</strong>
            <span>{user?.nombre || '-'}</span>
          </div>
          <div className="profile-item">
            <strong>Correo institucional</strong>
            <span>{user?.correo || '-'}</span>
          </div>
          <div className="profile-item">
            <strong>Rol</strong>
            <span className="status-chip">{user?.rol_id?.toUpperCase() || '-'}</span>
          </div>
        </section>

        <section className="profile-card">
          <h2>Estado</h2>
          <div className="profile-item">
            <strong>Acceso</strong>
            <span>Activo</span>
          </div>
          <div className="profile-item">
            <strong>Último inicio</strong>
            <span>{new Date().toLocaleDateString()}</span>
          </div>
          <div className="profile-note">
            Tu sesión se mantiene activa hasta que cierres sesión o cierres el navegador.
          </div>
        </section>
      </div>

      <section className="section-card">
        <h2>Resumen</h2>
        <p className="section-copy">Aquí encontrarás tu información rápida de acceso, estado de cuenta y próximos pasos.</p>
        <div className="tiles-grid">
          <div className="tile">
            <strong>Rol asignado</strong>
            <span>{user?.rol_id || 'Estudiante'}</span>
          </div>
          <div className="tile">
            <strong>Permisos</strong>
            <span>Acceso a tu perfil, citas y estado</span>
          </div>
          <div className="tile">
            <strong>Soporte</strong>
            <span>Contacto con tu consejero disponible</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Profile;
