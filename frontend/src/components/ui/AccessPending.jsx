import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext.jsx';
export default function AccessPending() {
  const { refreshSession } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return <section className="section-card access-pending" role="status"><span className="eyebrow">ACCESO INSTITUCIONAL</span><h1>Autorización de expedientes pendiente</h1><p>La actualización de permisos por estudiante debe aprobarse y aplicarse en Supabase. Los expedientes permanecen protegidos hasta verificar esa configuración.</p><p>No se cargaron datos académicos ni se generaron registros de ejemplo.</p>{error && <p role="alert">{error}</p>}<button className="primary-button" disabled={busy} onClick={async () => { setBusy(true); setError(''); try { await refreshSession(); } catch (err) { setError(err.message || 'No se pudieron comprobar los permisos.'); } finally { setBusy(false); } }}>{busy ? 'Comprobando permisos…' : 'Comprobar permisos nuevamente'}</button></section>;
}
