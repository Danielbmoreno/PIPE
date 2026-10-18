// The browser must never receive a key that bypasses RLS.
export function assertPublicSupabaseConfig(url, key) {
  if (!url || !key) throw new Error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY.');
  let endpoint;
  try { endpoint = new URL(url); } catch { throw new Error('La URL de Supabase no es válida.'); }
  const hosted = endpoint.protocol === 'https:' && /^[a-z0-9]+\.supabase\.co$/.test(endpoint.hostname);
  const local = endpoint.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(endpoint.hostname);
  if ((!hosted && !local) || endpoint.username || endpoint.password || endpoint.search || endpoint.hash) throw new Error('La URL de Supabase no es válida.');
  if (/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) return;
  try {
    const parts = key.split('.');
    if (parts.length !== 3) throw new Error();
    const encoded = parts[1].replaceAll('-', '+').replaceAll('_', '/');
    const claims = JSON.parse(atob(encoded + '='.repeat((4 - encoded.length % 4) % 4)));
    if (claims.role !== 'anon' || (hosted && claims.ref !== endpoint.hostname.split('.')[0])) throw new Error();
  } catch {
    throw new Error('El frontend requiere una clave publishable o anon del proyecto. No se admiten claves privilegiadas.');
  }
}
