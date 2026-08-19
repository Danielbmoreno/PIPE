import React, { useState, useEffect } from 'react';
import api from '../../api/apiClient.js';

const Notifications = () => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await api.get('/alertas');
        if (resp && resp.success) setItems(resp.data.slice(0, 6));
      } catch (e) {
        // ignore
      }
    };
    load();
  }, []);

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
