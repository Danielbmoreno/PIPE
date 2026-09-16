import { getRow, insertRow, listRows, removeRow, updateRow } from './supabaseService.js';
import { requireSupabase } from '../lib/supabase.js';

const getAll = () => listRows('citas');
const getForStudent = async (studentId) => {
	const { data, error } = await requireSupabase().from('citas').select('*').eq('estudiante_id', studentId);
	return { success: !error, data: data || [], message: '', error: error?.message || null };
};
const getById = (id) => getRow('citas', id);
const create = (payload) => insertRow('citas', payload);
const update = (id, payload) => updateRow('citas', id, payload);
const remove = (id) => removeRow('citas', id);

export default { getAll, getForStudent, getById, create, update, remove };
