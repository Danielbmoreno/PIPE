const Topbar = ({ searchQuery, setSearchQuery }) => {
  return (
    <header className="topbar">
      <div className="topbar-title">
        <span>PIPE</span>
        <small>Plataforma de Permanencia Estudiantil</small>
      </div>
      <div className="topbar-actions">
        <div className="search-box">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar en la vista actual..."
          />
        </div>
        <div className="user-card">
          <span>Bienvenido</span>
          <strong>Consejero</strong>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
