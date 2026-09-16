import { requireSupabase } from '../lib/supabase.js';
import { safeQuery } from './supabaseService.js';

const getPrograms = () => safeQuery(() => requireSupabase().from('programas').select('id,nombre').order('nombre'));
const getStudents = () => safeQuery(() => requireSupabase().from('estudiantes').select('id,nombre,codigo,programa_id,nivel_riesgo,usuario_id').order('nombre'));
const getCases = () => safeQuery(() => requireSupabase().from('casos').select('id,descripcion,estado,estudiante_id,alerta_id').order('id', { ascending: false }));

export default { getPrograms, getStudents, getCases };
