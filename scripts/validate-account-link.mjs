import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '../.local/validation/node_modules/@electric-sql/pglite/dist/index.js';
import { createOriginal } from './lib/rls-fixture.mjs';

// Reproduce the actual Edge database role, rather than the database owner.
// All records are synthetic, in a disposable local database.
const db = new PGlite();
const read = (path) => readFile(new URL('../' + path, import.meta.url), 'utf8');
let checks = 0;
const verify = (actual, expected) => { assert.deepEqual(actual, expected); checks++; };
try {
  await createOriginal(db, JSON.parse(await read('supabase/proposals/schema-observado.json')));
  await db.exec(await read('supabase/migrations/20261018003713_pipe_acompanamiento_rls_lote_autorizado.sql').then((s) => s.replace('-- set local pipe.approved', 'set local pipe.approved')));
  await db.exec(`create role service_role bypassrls;
    grant all on all tables in schema public to service_role;
    grant all on all sequences in schema public to service_role;
    insert into roles(id,nombre) values(3,'estudiante');
    insert into usuarios(id,nombre,correo,rol_id) values(10,'Cuenta de prueba','fixture@example.edu',3);
    insert into estudiantes(id,nombre) values(101,'Expediente de prueba');
    set role service_role;`);
  await assert.rejects(db.exec('update estudiantes set usuario_id=10 where id=101'), /permission denied for schema private/); checks++;
  await db.exec('reset role; grant usage on schema private to service_role; set role service_role;');
  await assert.rejects(db.exec('update estudiantes set usuario_id=10 where id=101'), /permission denied for function pipe_role/); checks++;
  await db.exec('reset role;');
  await db.exec(await read('supabase/migrations/20261018005645_pipe_account_link_service_permissions.sql'));
  await db.exec('begin; set local role service_role;');
  const linked = await db.query('update estudiantes set usuario_id=10 where id=101 and usuario_id is null returning id,usuario_id');
  verify(linked.rows, [{ id: 101, usuario_id: 10 }]);
  verify((await db.query('update estudiantes set usuario_id=10 where id=101 and usuario_id is null returning id')).rows, []);
  await db.exec('rollback;');
  verify((await db.query('select usuario_id from estudiantes where id=101')).rows, [{ usuario_id: null }]);
  for (const role of ['anon', 'authenticated', 'service_role']) {
    const { rows } = await db.query('select has_schema_privilege($1,\'private\',\'usage\') as usage, has_function_privilege($1,\'private.pipe_role()\',\'execute\') as execute', [role]);
    verify(rows[0], { usage: role !== 'anon', execute: role !== 'anon' });
  }
  verify((await db.query("select has_function_privilege('service_role','private.pipe_identity()','execute') as other_helper")).rows[0].other_helper, false);
  verify((await db.query("select count(*)::int as n from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity")).rows[0].n, 0);
  console.log(`Acceso de estudiantes: ${checks} comprobaciones aprobadas; fallo reproducido y vinculación corregida con service_role, sin ampliar permisos del navegador.`);
} finally { await db.close(); }
