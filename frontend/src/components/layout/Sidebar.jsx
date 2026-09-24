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
  { to: '/app/mis-citas', label: 'Mis citas', roles: ['estudiante'] },
  { to: '/app/mi-espacio', label: 'Mi espacio PIPE', roles: ['admin', 'estudiante'] },
  { to: '/app/proximamente', label: 'Próximamente', roles: ['admin', 'estudiante'] }
];

const Sidebar = ({ open = false, onClose = () => {} }) => {
  const { user, logout } = useAuth();
  const role = user?.rol_id;
  const isStudent = role === 'estudiante';
  const initials = String(user?.nombre || 'U').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

  return (
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
      <div>
        <div className="brand-lockup"><div className="brand">PIPE</div><span>Plataforma Inteligente de<br />Permanencia Estudiantil</span></div>
        <div className="sidebar-profile"><div className="avatar avatar-yellow">{initials}</div><div><strong>{user?.nombre || 'Bienvenido'}</strong><span>{role?.toUpperCase() || 'USUARIO'}</span></div></div>
      </div>

      <nav className="nav-menu">
        {ROUTES.filter((item) => item.roles.includes(role)).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            onClick={onClose}
          >
            <span className="nav-icon">{item.label === 'Dashboard' ? '⌂' : item.label === 'Mi perfil' ? '◎' : item.label === 'Mis citas' || item.label === 'Citas' ? '▣' : item.label === 'Estudiantes' ? '◉' : item.label === 'Alertas' ? '!' : item.label === 'Casos' ? '◌' : '✦'}</span>{isStudent && item.label === 'Dashboard' ? 'Inicio' : item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        {isStudent && <p className="sidebar-motto">“Cada paso cuenta.”</p>}
        <button className="link-button" onClick={logout}>Cerrar sesión</button>
      </div>
    </aside>
  );
};

export default Sidebar;
