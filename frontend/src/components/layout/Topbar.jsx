import { useAuth } from '../../contexts/AuthContext.jsx';
import GlobalSearch from '../ui/GlobalSearch.jsx';
import Notifications from '../ui/Notifications.jsx';

const Topbar = ({ searchQuery, setSearchQuery, onMenuClick }) => {
  const { user } = useAuth();

  return (
    <header className="topbar">
      <button className="menu-toggle" onClick={onMenuClick} aria-label="Abrir menú">☰</button>
      <div className="topbar-title">
        <span>PIPE</span>
        <small>Plataforma de Permanencia Estudiantil</small>
      </div>
      <div className="topbar-actions">
        <div className="topbar-search">
          <GlobalSearch onSearch={setSearchQuery} />
        </div>

        <Notifications />

        <div className="user-card">
          <span>{user?.nombre || 'Usuario'}</span>
          <strong>{user?.rol_id ? user.rol_id.toUpperCase() : 'Invitado'}</strong>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
