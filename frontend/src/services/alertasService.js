import { getRow, insertRow, listRows, removeRow, updateRow } from './supabaseService.js';

const getAll = () => listRows('alertas');
const getById = (id) => getRow('alertas', id);
const create = (payload) => insertRow('alertas', payload);
const update = (id, payload) => updateRow('alertas', id, payload);
const remove = (id) => removeRow('alertas', id);

export default { getAll, getById, create, update, remove };
