import { requireSupabase } from '../lib/supabase.js';
import { createPipeRepository } from '../lib/pipeRepository.js';
let repository;
export const getRepository = () => repository ||= createPipeRepository(requireSupabase());
export const resetAccess = () => repository?.reset();
export const safeQuery = async (query) => {
  try { const r = await query(); return { success: !r.error, data: r.data ?? null, message: '', error: r.error?.message || null }; }
  catch (error) { return { success: false, data: null, message: '', error: error.message }; }
};
const call = async (method, ...args) => {
  try { return await getRepository()[method](...args); }
  catch (error) { return { success: false, data: null, message: '', error: error.message }; }
};
export const listRows = (table, filters) => call('list', table, filters);
export const getRow = (table, id) => call('get', table, id);
export const insertRow = (table, values) => call('create', table, values);
export const updateRow = (table, id, values) => call('update', table, id, values);
export const removeRow = (table, id) => call('remove', table, id);
