import { useAuth } from '../../contexts/AuthContext.jsx';
import GlobalSearch from '../ui/GlobalSearch.jsx';
import Notifications from '../ui/Notifications.jsx';

const Topbar = ({ searchQuery, setSearchQuery }) => {
  const { user } = useAuth();

  return (
    <header className="topbar">
      <div className="topbar-title">
        <span>PIPE</span>
        <small>Plataforma de Permanencia Estudiantil</small>
      </div>
      <div className="topbar-actions">
        <div style={{ minWidth: 320, maxWidth: 520 }}>
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
