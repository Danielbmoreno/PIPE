const ConfirmModal = ({ open, title, message, onConfirm, onCancel }) => {
  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-card small">
        <div className="modal-header">
          <h3>{title}</h3>
        </div>
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-footer space-between">
          <button className="secondary-button" onClick={onCancel}>Cancelar</button>
          <button className="danger-button" onClick={onConfirm}>Eliminar</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
