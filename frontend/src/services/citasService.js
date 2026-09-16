import { getRow, insertRow, listRows, removeRow, updateRow } from './supabaseService.js';
import { requireSupabase } from '../lib/supabase.js';
import { safeQuery } from './supabaseService.js';

const getAll = () => listRows('citas');
const getForStudent = async (studentId) => {
	const result = await safeQuery(() => requireSupabase().from('citas').select('*').eq('estudiante_id', studentId));
	return { ...result, data: result.data || [] };
};
const getById = (id) => getRow('citas', id);
const create = (payload) => insertRow('citas', payload);
const update = (id, payload) => updateRow('citas', id, payload);
const remove = (id) => removeRow('citas', id);

export default { getAll, getForStudent, getById, create, update, remove };
