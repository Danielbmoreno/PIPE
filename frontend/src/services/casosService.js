import { getRow, insertRow, listRows, removeRow, updateRow } from './supabaseService.js';

const getAll = () => listRows('casos');
const getById = (id) => getRow('casos', id);
const create = (payload) => insertRow('casos', payload);
const update = (id, payload) => updateRow('casos', id, payload);
const remove = (id) => removeRow('casos', id);

export default { getAll, getById, create, update, remove };
