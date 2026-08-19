import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';

const MainLayout = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-panel">
        <Topbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <main className="content-area">
          <Outlet context={{ searchQuery }} />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
