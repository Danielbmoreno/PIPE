import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transformWithEsbuild } from 'vite';
import { isInstitutionalEmail } from '../src/lib/institutionalEmail.js';

test('correo institucional: admite .edu.co y rechaza dominios semejantes o direcciones inventadas', () => {
  for (const email of ['fixture@uniminuto.edu.co', 'fixture@universidad.edu', ' FIXTURE@UNIMINUTO.EDU.CO ']) assert.equal(isInstitutionalEmail(email), true);
  for (const email of ['fixture@uniminuto.edu.co.ejemplo.com', 'fixture@gmail.com', 'sin correo', 'fixture@.edu', 'fixture@@uniminuto.edu.co']) assert.equal(isInstitutionalEmail(email), false);
});

test('alta original: verifica administrador y vincula una sola cuenta al expediente existente', async (t) => {
  let handler;
  let config;
  const calls = [];
  const caller = { auth: { async getUser() { return { data: { user: config.authError ? null : { id: 'actor-fixture' } }, error: config.authError || null }; } }, async rpc() { return { data: config.scope || { version: 1, usuario_id: 1, rol_id: 1 }, error: config.scopeError || null }; } };
  const admin = {
    auth: { admin: {
      async getUserById() { return { data: { user: config.pendingUser || null }, error: null }; },
      async updateUserById(id, values) { calls.push(['auth-activate', id, values]); return { error: null }; },
      async createUser(values) { calls.push(['auth-create', values]); return { data: { user: { id: 'new-auth-fixture' } }, error: null }; },
      async deleteUser(id) { calls.push(['auth-delete', id]); return { error: null }; }
    } },
    from(table) {
      let action = 'read'; let values; const predicates = {};
      const query = {
        select() { return query; }, eq(key, value) { predicates[key] = value; return query; },
        is(key, value) { predicates[key] = value; return query; },
        ilike() { return query; }, async limit() { return { data: [], error: null }; },
        insert(payload) { action = 'insert'; values = payload; return query; },
        update(payload) { action = 'update'; values = payload; return query; },
        delete() { action = 'delete'; return query; },
        async maybeSingle() {
          if (table === 'estudiantes') return { data: config.student, error: null };
          if (table === 'usuarios') return { data: config.staffTarget || config.existingProfile || null, error: null };
          return { data: { id: 1 }, error: null };
        },
        async single() {
          calls.push([table, action, values, predicates]);
          if (table === 'usuarios') return config.profileFailure ? { data: null, error: { message: 'Fixture failure' } } : { data: { id: 20, ...(config.staffTarget || {}), ...values }, error: null };
          return { data: { id: 101, nombre: 'Estudiante de prueba', ...values }, error: null };
        },
        then(resolve) { calls.push([table, action, values, predicates]); return Promise.resolve({ error: null }).then(resolve); }
      };
      return query;
    }
  };
  globalThis.__pipeAccountFixtureClient = (_url, key) => key === 'service-fixture' ? admin : caller;
  globalThis.Deno = { env: { get(name) { return name === 'SUPABASE_SERVICE_ROLE_KEY' ? 'service-fixture' : 'public-fixture'; } }, serve(fn) { handler = fn; } };
  t.after(() => { delete globalThis.Deno; delete globalThis.__pipeAccountFixtureClient; });
  const raw = await readFile(new URL('../../supabase/functions/create-student/index.ts', import.meta.url), 'utf8');
  const source = raw.replace(/^import[^\n]+\n/, 'const createClient = (...args) => globalThis.__pipeAccountFixtureClient(...args);\n');
  const transformed = await transformWithEsbuild(source, 'create-student.ts', { loader: 'ts', format: 'esm' });
  await import('data:text/javascript;base64,' + Buffer.from(transformed.code).toString('base64'));
  const originalError = console.error;
  t.mock.method(console, 'error', (...args) => { if (!String(args[0]).includes('create-student:')) originalError(...args); });
  const request = (payload, authenticated = true) => handler(new Request('https://fixture.invalid/create-student', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(authenticated ? { Authorization: 'Bearer fixture' } : {}) }, body: JSON.stringify(payload) }));
  const payload = { estudiante_id: 101, correo: 'fixture@uniminuto.edu.co', password: 'IndividualFixture!2026', correo_verificado: true };
  config = { student: { id: 101, nombre: 'Estudiante de prueba', usuario_id: null, correo: 'fixture@uniminuto.edu.co' } };
  assert.equal((await request(payload, false)).status, 401);
  config.authError = { message: 'Invalid or expired fixture token' };
  assert.equal((await request(payload)).status, 401);
  assert.equal(calls.length, 0);
  delete config.authError;
  config.scopeError = { message: 'Fixture RLS contract unavailable' };
  assert.equal((await request(payload)).status, 403);
  assert.equal(calls.length, 0);
  delete config.scopeError;
  config.scope = { version: 1, usuario_id: 2, rol_id: 2 };
  assert.equal((await request(payload)).status, 403);
  assert.equal(calls.length, 0);
  delete config.scope;
  assert.equal((await request({ ...payload, correo_verificado: false })).status, 400);
  assert.equal((await request({ ...payload, correo: 'fixture@gmail.com' })).status, 400);
  const response = await request(payload);
  assert.equal(response.status, 201);
  const profileWrite = calls.find((c) => c[0] === 'usuarios');
  assert.equal(profileWrite[2].rol_id, 3);
  assert.equal(profileWrite[2].auth_user_id, 'new-auth-fixture');
  const academicWrite = calls.find((c) => c[0] === 'estudiantes');
  assert.equal(academicWrite[1], 'update');
  assert.deepEqual(academicWrite[2], { usuario_id: 20 });
  assert.deepEqual(academicWrite[3], { id: 101, usuario_id: null });
  assert.deepEqual(calls.find((c) => c[0] === 'auth-create')[1].user_metadata, { nombre: 'Estudiante de prueba' });
  calls.length = 0;
  config.student.usuario_id = 20;
  assert.equal((await request(payload)).status, 409);
  assert.equal(calls.length, 0);
  config.student.usuario_id = null;
  assert.equal((await request({ ...payload, correo: 'otro@uniminuto.edu.co' })).status, 409);
  assert.equal(calls.length, 0);
  config.existingProfile = { id: 99 };
  assert.equal((await request(payload)).status, 409);
  assert.equal(calls.length, 0);
  config.existingProfile = null; config.profileFailure = true;
  assert.equal((await request(payload)).status, 500);
  assert.ok(calls.some((c) => c[0] === 'auth-delete' && c[1] === 'new-auth-fixture'));
  assert.ok(!calls.some((c) => c[0] === 'estudiantes' && c[1] === 'delete'));
  calls.length = 0; config.profileFailure = false;
  config.staffTarget = { id: 30, nombre: 'Consejería de prueba', correo: 'fixture@universidad.edu', rol_id: 2, activo: true, auth_user_id: null };
  const staffPayload = { perfil_id: 30, correo: 'fixture@universidad.edu', password: 'IndividualFixture!2026', correo_verificado: true };
  const staffResponse = await request(staffPayload);
  assert.equal(staffResponse.status,201);
  assert.equal((await staffResponse.json()).usuario.rol_id,2);
  assert.deepEqual(calls.find((c) => c[0] === 'usuarios')[2],{auth_user_id:'new-auth-fixture'});
  assert.ok(!calls.some((c) => c[0] === 'estudiantes'));
  calls.length = 0; config.staffTarget.auth_user_id = 'pending-auth-fixture';
  config.pendingUser = { email: staffPayload.correo, app_metadata: { pipe_estado: 'pendiente_activacion_rls', pipe_rol_previsto: 2 } };
  assert.equal((await request(staffPayload)).status,200);
  assert.equal(calls.find((c) => c[0] === 'auth-activate')[2].ban_duration,'none');
  calls.length = 0; config.pendingUser.app_metadata.pipe_estado = 'activo';
  assert.equal((await request(staffPayload)).status,409);
  assert.equal(calls.length,0);
  calls.length = 0; config.staffTarget.rol_id = 1;
  assert.equal((await request(staffPayload)).status,403);
  assert.equal(calls.length,0);

});
