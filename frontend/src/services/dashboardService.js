import { listRows } from './supabaseService.js';
import { calculateMetrics } from '../lib/academic.js';
const tables = ['estudiantes', 'programas', 'alertas', 'casos', 'citas', 'consultas', 'seguimientos', 'intervenciones'];
export const getOverview = async () => {
  const results = await Promise.all(tables.map((table) => listRows(table)));
  const failure = results.find((r) => !r.success);
  if (failure) return { success: false, data: null, error: failure.error };
  const data = Object.fromEntries(tables.map((table, i) => [table, results[i].data]));
  data.intervenciones = data.intervenciones.map((r) => ({ ...r, estudiante_id: data.casos.find((c) => c.id === r.caso_id)?.estudiante_id }));
  return { success: true, data, error: null };
};
const getMetrics = async () => { const result = await getOverview(); return result.success ? { ...result, data: calculateMetrics(result.data) } : result; };
export default { getOverview, getMetrics };
