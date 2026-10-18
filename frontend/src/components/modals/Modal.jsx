import { useEffect, useId, useRef } from 'react';
export default function Modal({ title, open, onClose, children, footer }) {
  const dialog = useRef(null);
  const titleId = useId();
  useEffect(() => {
    if (!open || !dialog.current) return;
    const element = dialog.current;
    const previous = document.activeElement;
    element.showModal();
    return () => { element.close(); if (previous?.isConnected) previous.focus(); };
  }, [open]);
  if (!open) return null;
  return <dialog className="pipe-dialog" ref={dialog} aria-labelledby={titleId} onCancel={(e) => { e.preventDefault(); onClose(); }}><div className="modal-header"><h2 id={titleId}>{title}</h2><button className="modal-close" aria-label="Cerrar ventana" onClick={onClose}>×</button></div><div className="modal-body">{children}</div>{footer && <div className="modal-footer">{footer}</div>}</dialog>;
}
