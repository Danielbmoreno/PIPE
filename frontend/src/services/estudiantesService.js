import { getRow, listRows, removeRow, updateRow } from './supabaseService.js';
import { insertRow } from './supabaseService.js';

const estudiantesService = {
  getAll: () => listRows('estudiantes'),
  getById: (id) => getRow('estudiantes', id),
  create: (payload) => insertRow('estudiantes', payload),
  update: (id, payload) => updateRow('estudiantes', id, payload),
  remove: (id) => removeRow('estudiantes', id)
};

export default estudiantesService;
