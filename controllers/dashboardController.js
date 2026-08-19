const db = require('../config/db');
const { sendSuccess, sendError } = require('./responseHelper');

const normalizeText = (value) => {
  return String(value || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
};

const getDashboardMetrics = (req, res) => {
  try {
    const estudiantes = db.getAll('estudiantes');
    const alertas = db.getAll('alertas');
    const casos = db.getAll('casos');
    const citas = db.getAll('citas');

    const today = new Date().toISOString().slice(0, 10);
    const citasHoy = citas.filter((cita) => cita.fecha === today).length;
    const citasPerdidas = citas.filter((cita) => normalizeText(cita.estado).includes('no')).length;
    const casosAbiertos = casos.filter((caso) => {
      const estado = normalizeText(caso.estado);
      return estado && !['cerrado', 'closed'].includes(estado);
    }).length;
    const estudiantesAltoRiesgo = estudiantes.filter((estudiante) => {
      const nivel = normalizeText(estudiante.nivel_riesgo);
      return ['alto', 'critico', 'critico'].includes(nivel);
    }).length;
    const alertasCriticas = alertas.filter((alerta) => ['critico', 'critico'].includes(normalizeText(alerta.nivel_riesgo))).length;

    return sendSuccess(res, {
      totalEstudiantes: estudiantes.length,
      alertasAbiertas: alertas.length,
      casosAbiertos,
      citasHoy,
      estudiantesAltoRiesgo,
      alertasCriticas,
      citasPerdidas
    }, 'Métricas del dashboard cargadas');
  } catch (exception) {
    console.error('Excepción en getDashboardMetrics:', exception);
    return sendError(res, exception.message || 'Error interno al cargar métricas', 500);
  }
};

module.exports = { getDashboardMetrics };