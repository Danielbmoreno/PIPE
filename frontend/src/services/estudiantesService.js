import { getRow, listRows, removeRow, updateRow } from './supabaseService.js';
import { requireSupabase } from '../lib/supabase.js';

const createStudentFunction = import.meta.env.VITE_SUPABASE_CREATE_STUDENT_FUNCTION || 'create-student';

const estudiantesService = {
  getAll: () => listRows('estudiantes'),
  getById: (id) => getRow('estudiantes', id),
  create: async (payload) => {
    try {
      const { data, error } = await requireSupabase().functions.invoke(createStudentFunction, { body: payload });
      return { success: !error, data, message: '', error: error?.message || null };
    } catch (error) {
      console.error('Error invocando create-student:', error);
      return { success: false, data: null, message: '', error: error.message || 'No se pudo crear la cuenta del estudiante.' };
    }
  },
  update: (id, payload) => updateRow('estudiantes', id, payload),
  remove: (id) => removeRow('estudiantes', id)
};

export default estudiantesService;
