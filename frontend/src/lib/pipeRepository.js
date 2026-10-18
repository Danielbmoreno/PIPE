import { bogotaDay, validDate, appointmentInstant } from './academic.js';
export const ACCESS_PENDING = 'La autorización por estudiante está pendiente de activar en Supabase. No se consultaron expedientes.';
export const COLUMNS = {
  estudiantes: 'id,nombre,codigo,correo,programa_id,usuario_id,nivel_riesgo,created_at,semestre,estado,institucion,sede,rendimiento_resumen,estado_acompanamiento',
  programas: 'id,nombre,facultad_id',
  alertas: 'id,estudiante_id,usuario_id,descripcion,nivel_riesgo,created_at',
  casos: 'id,estudiante_id,usuario_id,alerta_id,descripcion,estado,created_at',
  citas: 'id,estudiante_id,usuario_id,consejero_id,caso_id,fecha,hora,hora_fin,estado,motivo,created_at',
  intervenciones: 'id,caso_id,usuario_id,descripcion,created_at',
  consultas: 'id,estudiante_id,usuario_id,caso_id,cita_id,tipo,fecha,descripcion,created_at',
  seguimientos: 'id,estudiante_id,usuario_id,caso_id,cita_id,fecha,descripcion,estado,resultado,realizado_en,created_at'
};
const staffOnly = ['alertas', 'casos', 'intervenciones'];
const reply = (data, error = null) => ({ success: !error, data, error: error?.message || null, message: '' });
export function createPipeRepository(client) {
  let scopePromise;
  let scopeAt = 0;
  const reset = () => { scopePromise = null; };
  const access = async () => {
    if (!scopePromise || Date.now() - scopeAt > 10000) {
      scopeAt = Date.now();
      scopePromise = (async () => {
        const { data, error } = await client.rpc('pipe_access_context');
        if (error || data?.version !== 1 || ![1, 2, 3].includes(data.rol_id) || !Number.isInteger(data.usuario_id) || !Array.isArray(data.estudiante_ids) || !Array.isArray(data.caso_ids)) throw new Error(ACCESS_PENDING);
        return data;
      })();
      scopePromise.catch(reset);
    }
    return scopePromise;
  };
  const list = async (table, filters = []) => {
    try {
      if (!COLUMNS[table]) throw new Error('Recurso no autorizado.');
      const scope = await access();
      if (scope.rol_id === 3 && staffOnly.includes(table)) return reply([]);
      if (scope.rol_id !== 1 && table !== 'programas' && !scope.estudiante_ids.length) return reply([]);
      if (scope.rol_id !== 1 && table === 'intervenciones' && !scope.caso_ids.length) return reply([]);
      const records = [];
      for (let offset = 0; ; offset += 500) {
        let query = client.from(table).select(COLUMNS[table]);
        if (scope.rol_id !== 1 && table !== 'programas') query = query.in(table === 'estudiantes' ? 'id' : table === 'intervenciones' ? 'caso_id' : 'estudiante_id', table === 'intervenciones' ? scope.caso_ids : scope.estudiante_ids);
        for (const [column, value] of filters) query = query.eq(column, value);
        const { data, error } = await query.order('id', { ascending: false }).range(offset, offset + 499);
        if (error) throw error;
        records.push(...(data || []));
        if (!data || data.length < 500) break;
      }
      return reply(records);
    } catch (error) { return reply(null, error); }
  };
  const get = async (table, id) => {
    const result = await list(table, [['id', id]]);
    if (!result.success) return result;
    return result.data.length === 1 ? reply(result.data[0]) : reply(null, new Error('Registro no disponible para tu cuenta.'));
  };
  const write = async (table, payload, id = null) => {
    try {
      const scope = await access();
      if (![1, 2].includes(scope.rol_id) || !COLUMNS[table] || table === 'programas') throw new Error('No tienes permiso para modificar este registro.');
      if (table === 'estudiantes' && id === null) throw new Error('Usa el alta administrativa de estudiantes para vincular correctamente su cuenta.');
      let values = { ...payload };
      let existingRow;
      if (id !== null) {
        const existing = await get(table, id);
        if (!existing.success) throw new Error(existing.error);
        existingRow = existing.data;
        if (values.estudiante_id !== undefined && Number(values.estudiante_id) !== Number(existingRow.estudiante_id)) throw new Error('Un registro no se puede trasladar a otro estudiante.');
        if (table === 'intervenciones' && values.caso_id !== undefined && Number(values.caso_id) !== Number(existingRow.caso_id)) throw new Error('Una intervención debe conservar su caso original.');
        delete values.usuario_id;
        if (table === 'estudiantes' && scope.rol_id === 2) values = Object.fromEntries(Object.entries(values).filter(([key]) => ['semestre', 'estado', 'rendimiento_resumen', 'estado_acompanamiento'].includes(key)));
      } else values.usuario_id = scope.usuario_id;
      const allowed = COLUMNS[table].split(',').filter((key) => !['id', 'created_at'].includes(key));
      values = Object.fromEntries(Object.entries(values).filter(([key]) => allowed.includes(key)));
      const record = { ...existingRow, ...values };
      if (table === 'estudiantes' && values.semestre != null && (!Number.isInteger(values.semestre) || values.semestre < 1 || values.semestre > 20)) throw new Error('El semestre debe ser un número entre 1 y 20.');
      if (values.estudiante_id && scope.rol_id !== 1 && !scope.estudiante_ids.includes(Number(values.estudiante_id))) throw new Error('El estudiante no está asignado a tu cuenta.');
      if (values.descripcion !== undefined && !String(values.descripcion).trim()) throw new Error('La descripción no puede estar vacía.');
      for (const [field, parent] of [['alerta_id', 'alertas'], ['caso_id', 'casos'], ['cita_id', 'citas']]) {
        if (!record[field]) continue;
        const related = await get(parent, record[field]);
        if (!related.success || (record.estudiante_id && Number(related.data.estudiante_id) !== Number(record.estudiante_id))) throw new Error('El registro relacionado debe pertenecer al mismo estudiante autorizado.');
        if (field === 'cita_id' && record.caso_id && related.data.caso_id && Number(record.caso_id) !== Number(related.data.caso_id)) throw new Error('La cita está relacionada con otro caso.');
      }
      if (['citas', 'consultas', 'seguimientos'].includes(table) && !validDate(record.fecha)) throw new Error('Selecciona una fecha válida.');
      if (table === 'consultas' && record.fecha > bogotaDay()) throw new Error('Solo se pueden registrar consultas efectivamente realizadas.');
      if (table === 'citas') {
        if (scope.rol_id === 2) values.consejero_id = scope.usuario_id;
        if (!(values.consejero_id || record.consejero_id)) throw new Error('Selecciona un consejero asignado.');
        const validTime = (value) => /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value);
        if (!validTime(record.hora) || (record.hora_fin && !validTime(record.hora_fin))) throw new Error('Selecciona una hora válida de Bogotá.');
        if (record.hora_fin && record.hora_fin.slice(0, 5) <= record.hora.slice(0, 5)) throw new Error('La hora final debe ser posterior a la inicial.');
        if (!String(record.motivo || '').trim()) throw new Error('Indica el motivo de la cita.');
        if (!['programada', 'atendida', 'cancelada', 'no asistió'].includes(record.estado)) throw new Error('Selecciona un estado válido de la cita.');
        if (['atendida', 'no asistió'].includes(record.estado) && appointmentInstant(record) > Date.now()) throw new Error('Una cita futura debe permanecer programada o cancelada.');
      }
      if (table === 'seguimientos') {
        if (!['pendiente', 'completado', 'cancelado'].includes(record.estado)) throw new Error('Selecciona un estado válido del seguimiento.');
        if (record.estado === 'completado' && record.fecha > bogotaDay()) throw new Error('Un compromiso futuro todavía no puede figurar como completado.');
        values.realizado_en = record.estado === 'completado' ? existingRow?.realizado_en || new Date().toISOString() : null;
      }
      const query = id === null ? client.from(table).insert(values) : client.from(table).update(values).eq('id', id);
      const { data, error } = await query.select(COLUMNS[table]).single();
      if (error) throw error;
      if (!data) throw new Error('La operación no afectó un registro autorizado.');
      reset();
      return reply(data);
    } catch (error) { return reply(null, error); }
  };
  const remove = async (table, id) => {
    try {
      const scope = await access();
      if (scope.rol_id !== 1 || !COLUMNS[table] || table === 'programas') throw new Error('La eliminación está reservada a administración.');
      const { data, error } = await client.from(table).delete().eq('id', id).select('id').single();
      if (error) throw error;
      if (!data) throw new Error('No se eliminó ningún registro.');
      reset();
      return reply(data);
    } catch (error) { return reply(null, error); }
  };
  return { access, list, get, create: (table, values) => write(table, values), update: (table, id, values) => write(table, values, id), remove, reset };
}
