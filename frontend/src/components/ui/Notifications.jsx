import React, { useState, useEffect } from 'react';
import alertasService from '../../services/alertasService.js';
import { useAuth } from '../../contexts/AuthContext.jsx';

const Notifications = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (user?.access_ready !== true || user.rol_id === 'estudiante') { setItems([]); return; }
    const load = async () => {
      try {
        const resp = await alertasService.getAll();
        if (resp && resp.success) setItems(resp.data.slice(0, 6));
      } catch (e) {
        // ignore
      }
    };
    load();
  }, [user]);

  return (
    <div className="notifications">
      <button className="link-button" onClick={() => setOpen(!open)}>Notificaciones ({items.length})</button>
      {open && (
        <div className="notifications-list">
          {items.length === 0 ? (
            <div className="empty-state">No hay notificaciones recientes.</div>
          ) : (
            items.map((it) => (
              <div key={it.id} className="notification-item">
                <strong>Alerta #{it.id}</strong>
                <p>{it.descripcion}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;
