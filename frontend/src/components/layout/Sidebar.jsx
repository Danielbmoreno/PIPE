import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="brand">PIPE</div>
      <nav className="nav-menu">
        <NavLink to="/app/dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Dashboard</NavLink>
        <NavLink to="/app/estudiantes" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Estudiantes</NavLink>
        <NavLink to="/app/alertas" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Alertas</NavLink>
        <NavLink to="/app/casos" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Casos</NavLink>
        <NavLink to="/app/intervenciones" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Intervenciones</NavLink>
        <NavLink to="/app/citas" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Citas</NavLink>
      </nav>
      <div className="sidebar-footer">PIPE - Permanencia Estudiantil</div>
    </aside>
  );
};

export default Sidebar;
