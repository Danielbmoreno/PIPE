import test from 'node:test';
import assert from 'node:assert/strict';
import { ACCESS_PENDING, createPipeRepository } from '../src/lib/pipeRepository.js';

// Isolated transport fixture; this test never imports the real Supabase client.
function fixture({ role = 2, ids = [101], caseIds = [1], rpcError = null, tables = {}, mutation = { data: { id: 1 }, error: null } } = {}) {
  const calls = [];
  const client = {
    async rpc(name) { calls.push(['rpc', name]); return { data: { version: 1, usuario_id: 2, rol_id: role, estudiante_ids: ids, caso_ids: caseIds }, error: rpcError }; },
    from(table) {
      calls.push(['from', table]);
      let predicates = []; let action = false;
      const query = {
        select(columns) { calls.push(['select', table, columns]); return query; },
        eq(column, value) { predicates.push((r) => String(r[column]) === String(value)); calls.push(['eq', table, column, value]); return query; },
        in(column, values) { predicates.push((r) => values.includes(r[column])); calls.push(['in', table, column, values]); return query; },
        order() { return query; },
        async range(first, last) { calls.push(['range', table, first, last]); return { data: (tables[table] || []).filter((r) => predicates.every((p) => p(r))).slice(first, last + 1), error: null }; },
        insert(values) { action = true; calls.push(['insert', table, values]); return query; },
        update(values) { action = true; calls.push(['update', table, values]); return query; },
        delete() { action = true; calls.push(['delete', table]); return query; },
        async single() { assert.ok(action); return mutation; }
      };
      return query;
    }
  };
  return { repository: createPipeRepository(client), calls };
}

test('sin RPC de permisos no se consulta ninguna tabla ni se escribe', async () => {
  const { repository, calls } = fixture({ rpcError: { message: 'Function not found' } });
  assert.equal((await repository.list('estudiantes')).error, ACCESS_PENDING);
  assert.equal((await repository.create('consultas', {})).success, false);
  assert.equal(calls.filter(([name]) => name === 'from').length, 0);
});

test('consejero: todas las tablas se filtran por estudiantes y casos asignados', async () => {
  const { repository, calls } = fixture({ tables: { estudiantes: [{ id: 101 }, { id: 102 }], intervenciones: [{ id: 1, caso_id: 1 }, { id: 2, caso_id: 2 }] } });
  assert.deepEqual((await repository.list('estudiantes')).data.map((r) => r.id), [101]);
  assert.deepEqual((await repository.list('intervenciones')).data.map((r) => r.id), [1]);
  assert.ok(calls.some((c) => c[0] === 'in' && c[1] === 'intervenciones' && c[2] === 'caso_id'));
  const empty = fixture({ ids: [] });
  assert.deepEqual((await empty.repository.list('estudiantes')).data, []);
  assert.equal(empty.calls.filter(([name]) => name === 'from').length, 0);
});

test('estudiante: no obtiene notas internas ni puede modificar registros', async () => {
  const { repository, calls } = fixture({ role: 3 });
  for (const table of ['alertas', 'casos', 'intervenciones']) assert.deepEqual((await repository.list(table)).data, []);
  assert.equal((await repository.create('consultas', {})).success, false);
  assert.equal(calls.filter(([name]) => name === 'from').length, 0);
});

test('paginación: los indicadores reciben más de 500 registros sin truncamiento', async () => {
  const { repository, calls } = fixture({ role: 1, tables: { estudiantes: Array.from({ length: 1201 }, (_, i) => ({ id: i + 1 })) } });
  assert.equal((await repository.list('estudiantes')).data.length, 1201);
  assert.equal(calls.filter(([name]) => name === 'range').length, 3);
  assert.ok(!calls.filter(([name]) => name === 'select').some((c) => c[2] === '*'));
});

test('edición: conserva estudiante y autor, elimina campos no modificables', async () => {
  const row = { id: 1, estudiante_id: 101, usuario_id: 1, fecha: '2020-01-01', tipo: 'consulta', descripcion: 'Anterior' };
  const { repository, calls } = fixture({ tables: { consultas: [row] } });
  assert.equal((await repository.update('consultas', 1, { descripcion: 'Actualizada', usuario_id: 999, id: 88, created_at: '2000-01-01', password: 'fixture' })).success, true);
  assert.deepEqual(calls.find(([name]) => name === 'update')[2], { descripcion: 'Actualizada' });
  assert.equal((await repository.update('consultas', 1, { estudiante_id: 102 })).success, false);
});

test('relaciones: rechaza casos y citas de otro estudiante antes de escribir', async () => {
  const { repository, calls } = fixture({ role: 1, tables: { casos: [{ id: 9, estudiante_id: 102 }] } });
  assert.equal((await repository.create('consultas', { estudiante_id: 101, caso_id: 9, fecha: '2020-01-01', tipo: 'consulta', descripcion: 'Fixture' })).success, false);
  assert.equal(calls.filter(([name]) => name === 'insert').length, 0);
});

test('fechas: impide atenciones y compromisos futuros como realizados', async () => {
  const { repository, calls } = fixture();
  assert.equal((await repository.create('consultas', { estudiante_id: 101, fecha: '2099-01-01', tipo: 'consulta', descripcion: 'Fixture' })).success, false);
  assert.equal((await repository.create('seguimientos', { estudiante_id: 101, fecha: '2099-01-01', estado: 'completado', descripcion: 'Fixture' })).success, false);
  assert.equal((await repository.create('citas', { estudiante_id: 101, fecha: '2099-01-01', hora: '17:00', hora_fin: '18:00', estado: 'atendida', motivo: 'Fixture' })).success, false);
  assert.equal(calls.filter(([name]) => name === 'insert').length, 0);
});

test('operaciones: no informa éxito cuando RLS no devuelve una fila', async () => {
  const { repository } = fixture({ role: 1, mutation: { data: null, error: null } });
  assert.equal((await repository.remove('estudiantes', 101)).success, false);
  assert.equal((await repository.list('usuarios')).success, false);
  assert.equal((await fixture().repository.remove('estudiantes', 101)).success, false);
});
