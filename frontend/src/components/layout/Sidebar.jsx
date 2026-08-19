import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';

const ROUTES = [
  { to: '/app/dashboard', label: 'Dashboard', roles: ['admin', 'docente', 'consejero', 'estudiante'] },
  { to: '/app/estudiantes', label: 'Estudiantes', roles: ['admin', 'docente', 'consejero'] },
  { to: '/app/alertas', label: 'Alertas', roles: ['admin', 'docente', 'consejero'] },
  { to: '/app/casos', label: 'Casos', roles: ['admin', 'consejero'] },
  { to: '/app/citas', label: 'Citas', roles: ['admin', 'consejero'] },
  { to: '/app/intervenciones', label: 'Intervenciones', roles: ['admin'] },
  { to: '/app/profile', label: 'Mi perfil', roles: ['estudiante'] },
  { to: '/app/mis-citas', label: 'Mis citas', roles: ['estudiante'] }
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const role = user?.rol_id;

  return (
    <aside className="sidebar">
      <div>
        <div className="brand">PIPE</div>
        <p className="sidebar-role">{user ? `${user.nombre} · ${role?.toUpperCase()}` : 'Bienvenido'}</p>
      </div>

      <nav className="nav-menu">
        {ROUTES.filter((item) => item.roles.includes(role)).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="link-button" onClick={logout}>Cerrar sesión</button>
      </div>
    </aside>
  );
};

export default Sidebar;
