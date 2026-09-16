import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';

const MainLayout = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="main-panel">
        <Topbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} onMenuClick={() => setMenuOpen(true)} />
        <main className="content-area">
          <Outlet context={{ searchQuery }} />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
