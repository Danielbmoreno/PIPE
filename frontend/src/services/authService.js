import { requireSupabase } from '../lib/supabase.js';
import { getRepository, resetAccess } from './supabaseService.js';
const roleMap = { 1: 'admin', 2: 'consejero', 3: 'estudiante' };
const getProfile = async (authUser) => {
  const { data, error } = await requireSupabase().from('usuarios').select('id,nombre,correo,rol_id,activo').eq('correo', authUser.email).maybeSingle();
  if (error) throw error;
  if (!data || data.activo === false || !roleMap[data.rol_id]) throw new Error('Tu cuenta no tiene un perfil institucional activo.');
  let access = null;
  try { access = await getRepository().access(); } catch { /* Display pending permissions, never query unscoped data. */ }
  const ready = access?.usuario_id === data.id && access?.rol_id === data.rol_id;
  return { ...data, rol_id: roleMap[data.rol_id], access_ready: ready, estudiante_id: ready && data.rol_id === 3 ? access.estudiante_ids[0] || null : null };
};
const login = async ({ correo, password }) => {
  const { data, error } = await requireSupabase().auth.signInWithPassword({ email: correo, password });
  if (error) return { success: false, data: null, error: error.message };
  try { return { success: true, data: { token: data.session.access_token, usuario: await getProfile(data.user) }, error: null }; }
  catch (error) { await requireSupabase().auth.signOut({ scope: 'local' }); throw error; }
};
const getSession = async () => {
  const { data, error } = await requireSupabase().auth.getSession();
  if (error || !data.session?.user) return null;
  return { token: data.session.access_token, usuario: await getProfile(data.session.user) };
};
const logout = async () => { const { error } = await requireSupabase().auth.signOut(); if (error) throw error; resetAccess(); };
const subscribe = (callback) => requireSupabase().auth.onAuthStateChange((event) => {
  resetAccess();
  // Defer SDK calls until the auth callback has released its lock.
  if (event !== 'INITIAL_SESSION') setTimeout(() => callback(event), 0);
});
export default { login, getSession, logout, subscribe };
