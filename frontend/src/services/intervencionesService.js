import { getRow, insertRow, listRows, removeRow, updateRow } from './supabaseService.js';

const getAll = () => listRows('intervenciones');
const getById = (id) => getRow('intervenciones', id);
const create = (payload) => insertRow('intervenciones', payload);
const update = (id, payload) => updateRow('intervenciones', id, payload);
const remove = (id) => removeRow('intervenciones', id);

export default { getAll, getById, create, update, remove };
