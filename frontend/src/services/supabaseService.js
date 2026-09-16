import { requireSupabase } from '../lib/supabase.js';

const response = (data, error = null) => ({
  success: !error,
  data,
  message: '',
  error: error?.message || null
});

export const listRows = async (table) => {
  const { data, error } = await requireSupabase().from(table).select('*');
  return response(data || [], error);
};

export const getRow = async (table, id) => {
  const { data, error } = await requireSupabase().from(table).select('*').eq('id', id).maybeSingle();
  return response(data, error);
};

export const insertRow = async (table, payload) => {
  const { data, error } = await requireSupabase().from(table).insert(payload).select().single();
  return response(data, error);
};

export const updateRow = async (table, id, payload) => {
  const { data, error } = await requireSupabase().from(table).update(payload).eq('id', id).select().single();
  return response(data, error);
};

export const removeRow = async (table, id) => {
  const { error } = await requireSupabase().from(table).delete().eq('id', id);
  return response(null, error);
};