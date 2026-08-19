const supabase = require('../config/supabase');
const { success, error } = require('./responseHelper');

const normalizeText = (value) => {
  return String(value || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
};

const getDashboardMetrics = async (req, res) => {
  try {
    const [estudiantesResp, alertasResp, casosResp, citasResp] = await Promise.all([
      supabase.from('estudiantes').select('*'),
      supabase.from('alertas').select('*'),
      supabase.from('casos').select('*'),
      supabase.from('citas').select('*')
    ]);

    if (estudiantesResp.error || alertasResp.error || casosResp.error || citasResp.error) {
      console.error('Error al obtener métricas del dashboard', {
        estudiantes: estudiantesResp.error,
        alertas: alertasResp.error,
        casos: casosResp.error,
        citas: citasResp.error
      });
      return error(res, 500, 'Error al calcular métricas del dashboard');
    }

    const today = new Date().toISOString().slice(0, 10);
    const citasHoy = citasResp.data.filter((cita) => cita.fecha === today).length;
    const citasPerdidas = citasResp.data.filter((cita) => normalizeText(cita.estado).includes('no')).length;
    const casosAbiertos = casosResp.data.filter((caso) => {
      const estado = normalizeText(caso.estado);
      return estado && !['cerrado', 'closed'].includes(estado);
    }).length;
    const estudiantesAltoRiesgo = estudiantesResp.data.filter((estudiante) => {
      const nivel = normalizeText(estudiante.nivel_riesgo);
      return ['alto', 'critico', 'critico'].includes(nivel);
    }).length;
    const alertasCriticas = alertasResp.data.filter((alerta) => ['critico', 'critico'].includes(normalizeText(alerta.nivel_riesgo))).length;

    return success(res, {
      totalEstudiantes: estudiantesResp.data.length,
      alertasAbiertas: alertasResp.data.length,
      casosAbiertos,
      citasHoy,
      estudiantesAltoRiesgo,
      alertasCriticas,
      citasPerdidas
    }, 'Métricas del dashboard cargadas');
  } catch (exception) {
    console.error('Excepción en getDashboardMetrics:', exception);
    return error(res, 500, 'Error interno al cargar métricas');
  }
};

module.exports = { getDashboardMetrics };