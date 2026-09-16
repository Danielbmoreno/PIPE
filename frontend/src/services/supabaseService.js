import { requireSupabase } from '../lib/supabase.js';

const response = (data, error = null) => ({
  success: !error,
  data: data ?? null,
  message: '',
  error: error?.message || null
});

export const safeQuery = async (query) => {
  try {
    const result = await query();
    return response(result.data, result.error);
  } catch (error) {
    console.error('Error en consulta Supabase:', error);
    return response(null, error);
  }
};

export const listRows = async (table) => {
  const result = await safeQuery(() => requireSupabase().from(table).select('*'));
  return { ...result, data: result.data || [] };
};

export const getRow = async (table, id) => {
  return safeQuery(() => requireSupabase().from(table).select('*').eq('id', id).maybeSingle());
};

export const insertRow = async (table, payload) => {
  return safeQuery(() => requireSupabase().from(table).insert(payload).select().single());
};

export const updateRow = async (table, id, payload) => {
  return safeQuery(() => requireSupabase().from(table).update(payload).eq('id', id).select().single());
};

export const removeRow = async (table, id) => {
  return safeQuery(() => requireSupabase().from(table).delete().eq('id', id));
};