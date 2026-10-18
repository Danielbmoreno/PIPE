import { getRow, insertRow, listRows, removeRow, updateRow } from './supabaseService.js';
export default {
  getAll: () => listRows('citas'), getForStudent: (id) => listRows('citas', [['estudiante_id', id]]),
  getById: (id) => getRow('citas', id), create: (values) => insertRow('citas', values),
  update: (id, values) => updateRow('citas', id, values), remove: (id) => removeRow('citas', id)
};
