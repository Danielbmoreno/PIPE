import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { requireSupabase } from '../lib/supabase.js';
import { isInstitutionalEmail } from '../lib/institutionalEmail.js';
import { emailRecoveryEnabled } from '../lib/accessPolicy.js';

export default function PasswordRecovery() {
  const [verified, setVerified] = useState(false);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    requireSupabase().auth.getUser().then(({ data, error }) => {
      if (active) { setVerified(!error && Boolean(data.user)); setChecking(false); }
    }).catch(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, []);
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      const client = requireSupabase();
      if (verified) {
        if (password.length < 12 || password !== confirmation) throw new Error('Usa al menos 12 caracteres y confirma la misma contraseña.');
        const { error } = await client.auth.updateUser({ password });
        if (error) throw new Error('No se pudo establecer la contraseña. Solicita un enlace nuevo si venció.');
        setPassword(''); setConfirmation('');
        await client.auth.signOut({ scope: 'local' }); setVerified(false);
        setMessage('Contraseña establecida. Ya puedes iniciar sesión con tu correo institucional.');
      } else {
        if (!emailRecoveryEnabled) throw new Error('La recuperación por correo no está disponible. Contacta al equipo institucional.');
        if (!isInstitutionalEmail(email)) throw new Error('Indica tu correo institucional.');
        const redirectTo = new URL(import.meta.env.BASE_URL, window.location.origin).href;
        const { error } = await client.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo });
        if (error) throw new Error('No se pudo solicitar el enlace. Espera unos minutos o contacta al equipo institucional.');
        setMessage('Si el correo corresponde a una cuenta habilitada, recibirás un enlace para establecer tu contraseña.');
      }
    } catch (error) { setError(error.message); }
    finally { setBusy(false); }
  };
  return <div className="login-page"><section className="login-panel">
    <div className="login-brand">PIPE</div><h1>{verified ? 'Establecer contraseña' : 'Recuperar acceso'}</h1>
    <p className="login-copy">{verified ? 'Tu contraseña se establece directamente con Supabase.' : emailRecoveryEnabled ? 'El enlace se envía al correo institucional de la cuenta.' : 'La recuperación por correo no está disponible en esta publicación. Contacta al equipo institucional para gestionar tu acceso.'}</p>
    {checking ? <p>Verificando el enlace…</p> : (verified || emailRecoveryEnabled) && <form className="login-form" onSubmit={submit}>
      {verified ? <><label>Contraseña individual<input type="password" autoComplete="new-password" minLength={12} required value={password} onChange={(e) => setPassword(e.target.value)} /></label><label>Confirmar contraseña<input type="password" autoComplete="new-password" minLength={12} required value={confirmation} onChange={(e) => setConfirmation(e.target.value)} /></label></> : <label>Correo institucional<input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>}
      <button className="primary-button" disabled={busy}>{busy ? 'Procesando…' : verified ? 'Establecer mi contraseña' : 'Solicitar enlace seguro'}</button>
    </form>}
    {error && <p className="error-text" role="alert">{error}</p>}{message && <p role="status">{message}</p>}
    <Link className="link-button" to="/login">Volver al inicio de sesión</Link>
  </section></div>;
}
