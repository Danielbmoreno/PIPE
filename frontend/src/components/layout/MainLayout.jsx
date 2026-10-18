import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import AccessPending from '../ui/AccessPending.jsx';
import '../../styles/acompaniamiento.css';

const MainLayout = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="main-panel">
        <Topbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} onMenuClick={() => setMenuOpen(true)} />
        <main className="content-area">
          {user?.access_ready === true ? <Outlet context={{ searchQuery }} /> : <AccessPending />}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
