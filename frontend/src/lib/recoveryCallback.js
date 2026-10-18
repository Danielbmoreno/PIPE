// Let Supabase consume recovery tokens before HashRouter can replace the hash.
// No token is returned, logged, or kept in application storage by this helper.
export async function prepareRecoveryRoute(client, location, history) {
  const params = new URLSearchParams(location.hash.slice(1));
  const recovery = ['recovery', 'invite'].includes(params.get('type'));
  const failed = params.has('error') || params.has('error_code');
  if (!recovery && !failed) return false;
  try { if (client) await client.auth.getSession(); } catch { /* The page explains an invalid or expired link. */ }
  finally { history.replaceState(null, '', location.pathname + '#/restablecer-contrasena'); }
  return true;
}
