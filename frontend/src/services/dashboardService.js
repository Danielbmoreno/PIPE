import { requireSupabase } from '../lib/supabase.js';

const normalizeText = (value) => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const getMetrics = async () => {
	const client = requireSupabase();
	const [estudiantesResp, alertasResp, casosResp, citasResp] = await Promise.all([
		client.from('estudiantes').select('id,nivel_riesgo'),
		client.from('alertas').select('id,nivel_riesgo'),
		client.from('casos').select('id,estado'),
		client.from('citas').select('id,fecha,estado')
	]);
	const error = [estudiantesResp, alertasResp, casosResp, citasResp].find((result) => result.error)?.error;
	if (error) return { success: false, data: null, message: '', error: error.message };

	const estudiantes = estudiantesResp.data || [];
	const alertas = alertasResp.data || [];
	const casos = casosResp.data || [];
	const citas = citasResp.data || [];
	const today = new Date().toISOString().slice(0, 10);

	return {
		success: true,
		data: {
			totalEstudiantes: estudiantes.length,
			alertasAbiertas: alertas.length,
			casosAbiertos: casos.filter(({ estado }) => !['cerrado', 'closed'].includes(normalizeText(estado))).length,
			citasHoy: citas.filter(({ fecha }) => fecha === today).length,
			estudiantesAltoRiesgo: estudiantes.filter(({ nivel_riesgo }) => ['alto', 'critico'].includes(normalizeText(nivel_riesgo))).length,
			alertasCriticas: alertas.filter(({ nivel_riesgo }) => normalizeText(nivel_riesgo) === 'critico').length,
			citasPerdidas: citas.filter(({ estado }) => normalizeText(estado).includes('no')).length
		},
		message: '',
		error: null
	};
};

export default { getMetrics };
