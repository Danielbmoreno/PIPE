export const TIME_ZONE = 'America/Bogota';
export const normalize = (value) => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
export const bogotaDay = (date = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
export const formatDate = (date, options = { day: 'numeric', month: 'short', year: 'numeric' }) => date ? new Intl.DateTimeFormat('es-CO', { timeZone: TIME_ZONE, ...options }).format(new Date(`${date.slice(0, 10)}T12:00:00-05:00`)) : 'Sin fecha';
export const validDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T12:00:00Z`)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;
export const appointmentInstant = (row) => Date.parse(`${row.fecha}T${row.hora || '00:00:00'}-05:00`);
export const isUpcoming = (row, now = new Date()) => normalize(row.estado) === 'programada' && appointmentInstant(row) >= now.getTime();
export const sortAppointments = (rows) => [...rows].sort((a, b) => `${a.fecha}${a.hora}`.localeCompare(`${b.fecha}${b.hora}`));
export const emptyFilters = () => ({ estudiante_id: '', desde: '', hasta: '', estado: '' });
export const filterRecords = (rows, f) => rows.filter((r) => (!f.estudiante_id || String(r.estudiante_id) === String(f.estudiante_id)) && (!f.desde || (r.fecha || r.created_at?.slice(0, 10)) >= f.desde) && (!f.hasta || (r.fecha || r.created_at?.slice(0, 10)) <= f.hasta) && (!f.estado || normalize(r.estado) === normalize(f.estado)));
export function calculateMetrics(data, now = new Date()) {
  const { estudiantes = [], citas = [], casos = [], alertas = [], consultas = [], seguimientos = [], intervenciones = [] } = data;
  return {
    totalEstudiantes: estudiantes.length,
    estudiantesBajoRiesgo: estudiantes.filter((e) => normalize(e.nivel_riesgo) === 'bajo').length,
    estudiantesAltoRiesgo: estudiantes.filter((e) => ['alto', 'critico'].includes(normalize(e.nivel_riesgo))).length,
    alertasRegistradas: alertas.length,
    casosAbiertos: casos.filter((r) => ['abierto', 'en seguimiento', 'en proceso'].includes(normalize(r.estado))).length,
    citasHoy: citas.filter((r) => r.fecha === bogotaDay(now) && normalize(r.estado) !== 'cancelada').length,
    citasProgramadas: citas.filter((r) => isUpcoming(r, now)).length,
    consultasRealizadas: consultas.filter((r) => r.tipo === 'consulta').length,
    intervencionesRegistradas: intervenciones.length,
    seguimientosCompletados: seguimientos.filter((r) => normalize(r.estado) === 'completado').length
  };
}
export function activityHistory(data) {
  const entries = [];
  for (const table of ['alertas', 'casos', 'citas', 'consultas', 'seguimientos', 'intervenciones']) {
    for (const row of data[table] || []) entries.push({ ...row, event_id: `${table}-${row.id}`, tipo: table, titulo: row.motivo || row.descripcion, fecha: row.fecha || row.created_at?.slice(0, 10), estado: row.estado || (table === 'consultas' ? 'realizada' : 'registrado') });
  }
  return entries.sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || '')));
}
