import { getRepository, getRow, listRows, removeRow, updateRow } from './supabaseService.js';
import { requireSupabase } from '../lib/supabase.js';

const createStudentFunction = import.meta.env.VITE_SUPABASE_CREATE_STUDENT_FUNCTION || 'create-student';

const estudiantesService = {
  getAll: () => listRows('estudiantes'),
  getById: (id) => getRow('estudiantes', id),
  create: async (payload) => {
    try {
      const scope = await getRepository().access();
      if (scope.rol_id !== 1) throw new Error('El alta de estudiantes corresponde a administración.');
      const { data, error } = await requireSupabase().functions.invoke(createStudentFunction, { body: payload });
      let message = error?.message || null;
      if (error?.context instanceof Response) {
        const detail = await error.context.json().catch(() => null);
        if (typeof detail?.error === 'string') message = detail.error;
      }
      return { success: !error, data, message: '', error: message };
    } catch (error) {
      console.error('Error invocando create-student:', error.message);
      return { success: false, data: null, message: '', error: error.message || 'No se pudo crear la cuenta del estudiante.' };
    }
  },
  update: (id, payload) => updateRow('estudiantes', id, payload),
  remove: (id) => removeRow('estudiantes', id)
};

export default estudiantesService;
