import { getRow, listRows, removeRow, updateRow } from './supabaseService.js';
import { requireSupabase } from '../lib/supabase.js';

const estudiantesService = {
  getAll: () => listRows('estudiantes'),
  getById: (id) => getRow('estudiantes', id),
  create: async (payload) => {
    if (!import.meta.env.VITE_SUPABASE_CREATE_STUDENT_FUNCTION) {
      throw new Error('Crear estudiantes con cuenta requiere una Edge Function configurada en VITE_SUPABASE_CREATE_STUDENT_FUNCTION.');
    }
    const { data, error } = await requireSupabase().functions.invoke(import.meta.env.VITE_SUPABASE_CREATE_STUDENT_FUNCTION, { body: payload });
    return { success: !error, data, message: '', error: error?.message || null };
  },
  update: (id, payload) => updateRow('estudiantes', id, payload),
  remove: (id) => removeRow('estudiantes', id)
};

export default estudiantesService;
