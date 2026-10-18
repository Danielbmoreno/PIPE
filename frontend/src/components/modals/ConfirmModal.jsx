import Modal from './Modal.jsx';
export default function ConfirmModal({ open, title, message, onConfirm, onCancel }) {
  return <Modal open={open} title={title} onClose={onCancel} footer={<div className="space-between"><button className="secondary-button" onClick={onCancel}>Cancelar</button><button className="danger-button" onClick={onConfirm}>Confirmar eliminación</button></div>}><p>{message}</p></Modal>;
}
