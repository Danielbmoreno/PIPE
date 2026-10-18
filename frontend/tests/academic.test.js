import test from 'node:test';
import assert from 'node:assert/strict';
import { activityHistory, bogotaDay, calculateMetrics, filterRecords, isUpcoming, sortAppointments, validDate } from '../src/lib/academic.js';

test('fechas de agenda: Bogotá, año bisiesto y próximas citas por hora y estado', () => {
  const now = new Date('2026-10-17T00:30:00Z');
  assert.equal(bogotaDay(now), '2026-10-16');
  assert.equal(validDate('2026-02-29'), false);
  assert.equal(validDate('2028-02-29'), true);
  assert.equal(validDate('2026-13-01'), false);
  assert.equal(isUpcoming({ fecha: '2026-10-16', hora: '19:00', estado: 'programada' }, now), false);
  assert.equal(isUpcoming({ fecha: '2026-10-16', hora: '20:00', estado: 'programada' }, now), true);
  assert.equal(isUpcoming({ fecha: '2026-10-20', hora: '17:00', estado: 'atendida' }, now), false);
  assert.equal(isUpcoming({ fecha: '2026-10-20', hora: '17:00', estado: 'cancelada' }, now), false);
  assert.equal(isUpcoming({ fecha: '2026-10-20', hora: '17:00', estado: null }, now), false);
  assert.deepEqual(sortAppointments([{ id: 2, fecha: '2026-10-21', hora: '18:00' }, { id: 1, fecha: '2026-10-21', hora: '17:00' }]).map((r) => r.id), [1, 2]);
});

test('indicadores: cuentan registros confirmados y conservan los datos desconocidos', () => {
  const now = new Date('2026-10-16T15:00:00-05:00');
  const data = {
    estudiantes: [{ id: 1, nivel_riesgo: null }, { id: 2, nivel_riesgo: 'crítico' }],
    citas: [{ fecha: '2026-10-16', hora: '17:00', estado: 'programada' }, { fecha: '2026-10-16', hora: '14:00', estado: 'atendida' }, { fecha: '2026-10-16', hora: '18:00', estado: 'cancelada' }],
    casos: [{ estado: 'abierto' }, { estado: 'cerrado' }],
    consultas: [{ tipo: 'consulta' }, { tipo: 'observacion' }],
    seguimientos: [{ estado: 'pendiente' }, { estado: 'completado' }],
    alertas: [{ id: 1 }], intervenciones: []
  };
  assert.deepEqual(calculateMetrics(data, now), { totalEstudiantes: 2, estudiantesBajoRiesgo: 0, estudiantesAltoRiesgo: 1, alertasRegistradas: 1, casosAbiertos: 1, citasHoy: 2, citasProgramadas: 1, consultasRealizadas: 1, intervencionesRegistradas: 0, seguimientosCompletados: 1 });
  assert.equal(data.estudiantes[0].nivel_riesgo, null);
  assert.equal(calculateMetrics({}).totalEstudiantes, 0);
});

test('filtros e historial: incluyen límites y mantienen separados los estados reales', () => {
  const rows = [{ id: 1, estudiante_id: 101, fecha: '2026-10-21', estado: 'programada' }, { id: 2, estudiante_id: 102, fecha: '2026-10-22', estado: 'atendida' }];
  assert.deepEqual(filterRecords(rows, { estudiante_id: '101', desde: '2026-10-21', hasta: '2026-10-21', estado: 'programada' }).map((r) => r.id), [1]);
  const history = activityHistory({ citas: rows, consultas: [{ id: 1, fecha: '2026-10-16', tipo: 'consulta', descripcion: 'Registro de prueba' }] });
  assert.equal(history.length, 3);
  assert.equal(history.find((r) => r.event_id === 'citas-1').estado, 'programada');
  assert.equal(history.find((r) => r.event_id === 'consultas-1').estado, 'realizada');
  assert.equal(activityHistory({}).length, 0);
});
