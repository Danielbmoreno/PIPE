const Unauthorized = () => {
  return (
    <div className="page-shell">
      <div className="page-header">
        <div>
          <h1>No autorizado</h1>
          <p>No tienes permisos para ver esta sección.</p>
        </div>
      </div>
      <div className="empty-state">
        Solo los usuarios con el rol adecuado pueden acceder aquí.
      </div>
    </div>
  );
};

export default Unauthorized;
