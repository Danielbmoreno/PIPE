import { listRows, insertRow, updateRow } from './supabaseService.js';
export const getConsultas = (filters) => listRows('consultas', filters);
export const getSeguimientos = (filters) => listRows('seguimientos', filters);
export const createConsulta = (values) => insertRow('consultas', values);
export const createSeguimiento = (values) => insertRow('seguimientos', values);
export const updateSeguimiento = (id, values) => updateRow('seguimientos', id, values);
