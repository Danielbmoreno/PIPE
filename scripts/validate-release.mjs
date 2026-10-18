import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { PGlite } from '../.local/validation/node_modules/@electric-sql/pglite/dist/index.js';
import { createOriginal } from './lib/rls-fixture.mjs';

// Private backups and proposals are loaded only into disposable local Postgres.
// Never prints names, emails, passwords, backup rows or SQL containing them.
const root = new URL('../', import.meta.url);
const read = (name) => readFile(new URL(name, root), 'utf8');
const backupText = await read('.local/backups/preintegracion-2026-10-17.json');
const backup = JSON.parse(backupText);
const snapshot = JSON.parse(await read('supabase/proposals/schema-observado.json'));
const plan = JSON.parse(await read('.local/approval/registros-previstos.json'));
const combined = await read('.local/approval/00_transaccion_completa_pendiente.sql');
const containment = await read('.local/approval/05_contencion_reversion_pendiente.sql');
const db = new PGlite();
let checks = 0;
const verify = (value, expected) => { assert.deepEqual(value, expected); checks++; };
const identifier = (name) => '"' + name.replaceAll('"', '""') + '"';
const rows = async (sql, params = []) => (await db.query(sql, params)).rows;
try {
  await createOriginal(db, snapshot);
  // A topological load keeps foreign keys active throughout restoration.
  const dependencies = new Map(Object.keys(backup.rows).map((name) => [name, new Set()]));
  for (const constraint of backup.constraints) {
    const match = constraint.definition.match(/REFERENCES (?:public\.)?"?(\w+)"?\(/);
    const table = constraint.table.replace('public.', '');
    if (match && match[1] !== table) dependencies.get(table)?.add(match[1]);
  }
  const pending = new Set(dependencies.keys());
  while (pending.size) {
    const ready = [...pending].filter((name) => [...dependencies.get(name)].every((dep) => !pending.has(dep)));
    assert.ok(ready.length, 'Revisar dependencias cíclicas del respaldo');
    for (const name of ready) {
      for (const record of backup.rows[name]) {
        const fields = Object.keys(record).map(identifier).join(',');
        await db.query(`insert into public.${identifier(name)} (${fields}) select ${fields} from jsonb_populate_record(null::public.${identifier(name)}, $1::jsonb)`, [record]);
      }
      verify((await rows(`select count(*)::int as n from public.${identifier(name)}`))[0].n, backup.rows[name].length);
      // Compare every restored non-credential field, not only row counts.
      const restored = (await rows(`select to_jsonb(t)${name === 'usuarios' ? "-'password'" : ''} as row from public.${identifier(name)} t order by id`)).map((r) => r.row);
      verify(restored, backup.rows[name]);
      await db.exec(`select setval(pg_get_serial_sequence('public.${name}','id'),greatest(coalesce((select max(id) from public.${identifier(name)}),0),1));`);
      pending.delete(name);
    }
  }
  await db.exec('alter table auth.users add column banned_until timestamptz; alter table auth.users add column raw_app_meta_data jsonb;');
  await db.query("insert into auth.users(id,email,banned_until,raw_app_meta_data) values($1,$2,now()+interval '100 years',$3)", [plan.nueva_consejera.auth_user_id, plan.nueva_consejera.correo, { pipe_estado:'pendiente_activacion_rls',pipe_rol_previsto:2 }]);
  const oldAccount = (await rows("select to_jsonb(u)-'password' as row from public.usuarios u where id=2"))[0].row;
  await db.exec(combined.replaceAll('-- set local pipe.approved', 'set local pipe.approved'));
  const counts = async () => (await rows('select (select count(*)::int from estudiantes) as estudiantes,(select count(*)::int from citas) as citas,(select count(*)::int from casos) as casos,(select count(*)::int from seguimientos) as seguimientos'))[0];
  const integratedCounts = await counts();
  verify(integratedCounts, { estudiantes:backup.rows.estudiantes.length+4, citas:backup.rows.citas.length+5, casos:backup.rows.casos.length+4, seguimientos:4 });
  verify((await rows('select activo from usuarios where id=$1',[plan.nueva_consejera.usuario_id]))[0].activo,true);
  const assigned = (await rows('select estudiante_id from consejero_estudiantes where consejero_id=$1 order by estudiante_id',[plan.nueva_consejera.usuario_id])).map((r) => r.estudiante_id);
  verify(assigned.length,4);
  await db.exec('begin;');
  await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.email',$2,true)",[plan.nueva_consejera.auth_user_id,plan.nueva_consejera.correo]);
  await db.exec('set local role authenticated;');
  verify((await rows('select id from estudiantes order by id')).map((r) => r.id),assigned);
  verify((await rows('select public.pipe_access_context() as c'))[0].c.rol_id,2);
  for (const [table, expected] of [['casos',4],['citas',5],['seguimientos',4],['alertas',0],['intervenciones',0],['consultas',0]]) verify((await rows(`select count(*)::int as n from public.${table}`))[0].n,expected);
  const caseId=(await rows('select id from casos where estudiante_id=$1',[assigned[0]]))[0].id;
  verify((await rows("insert into consultas(estudiante_id,usuario_id,fecha,tipo,descripcion) values($1,$2,current_date,'consulta','Validación local temporal') returning id",[assigned[0],plan.nueva_consejera.usuario_id])).length,1);
  verify((await rows("insert into intervenciones(caso_id,usuario_id,descripcion) values($1,$2,'Validación local temporal') returning id",[caseId,plan.nueva_consejera.usuario_id])).length,1);
  verify((await rows("insert into citas(estudiante_id,usuario_id,consejero_id,fecha,hora,hora_fin,estado,motivo) values($1,$2,$2,current_date+30,'09:00','10:00','programada','Validación local temporal') returning id",[assigned[0],plan.nueva_consejera.usuario_id])).length,1);
  await db.exec('rollback;');
  for (let i=0;i<assigned.length;i++) {
    await db.exec('begin;');
    const authId=`00000000-0000-0000-0001-${String(i+1).padStart(12,'0')}`;
    const email=`release-fixture-${i+1}@example.edu`;
    await db.query('insert into auth.users(id,email) values($1,$2)',[authId,email]);
    const userId=(await rows("insert into usuarios(nombre,correo,rol_id,activo,auth_user_id) values('Validación local temporal',$1,3,true,$2) returning id",[email,authId]))[0].id;
    await db.query('update estudiantes set usuario_id=$1 where id=$2',[userId,assigned[i]]);
    await db.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claim.email',$2,true)",[authId,email]);
    await db.exec('set local role authenticated;');
    verify((await rows('select id from estudiantes')).map((r) => r.id),[assigned[i]]);
    verify((await rows('select public.pipe_access_context() as c'))[0].c.rol_id,3);
    for (const table of ['alertas','casos','intervenciones']) verify((await rows(`select count(*)::int as n from public.${table}`))[0].n,0);
    verify((await rows('select estudiante_id from citas')).every((r) => r.estudiante_id===assigned[i]),true);
    verify((await rows('update estudiantes set semestre=9 where id=$1 returning id',[assigned[i]])).length,0);
    await db.exec('rollback;');
  }
  verify(await counts(),integratedCounts);
  await assert.rejects(db.exec(containment), /requiere aprobación/); checks++;
  await db.exec('rollback;');
  verify((await rows('select activo from usuarios where id=$1',[plan.nueva_consejera.usuario_id]))[0].activo,true);
  await db.exec(containment.replace('-- set local pipe.approved_containment', 'set local pipe.approved_containment'));
  verify(await counts(), integratedCounts);
  verify((await rows('select activo from usuarios where id=$1',[plan.nueva_consejera.usuario_id]))[0].activo,false);
  verify((await rows('select count(*)::int as n from consejero_estudiantes where consejero_id=$1 and activo',[plan.nueva_consejera.usuario_id]))[0].n,0);
  const currentOldAccount = (await rows("select to_jsonb(u)-'password'-'auth_user_id' as row from public.usuarios u where id=2"))[0].row;
  verify(currentOldAccount, oldAccount);
  // Baseline academic data remains byte-for-byte equivalent in original fields.
  for (const name of ['estudiantes','citas','alertas','casos','intervenciones']) {
    for (const original of backup.rows[name]) {
      const current = (await rows(`select to_jsonb(t) as row from public.${identifier(name)} t where id=$1`,[original.id]))[0].row;
      verify(Object.fromEntries(Object.keys(original).map((key) => [key,current[key]])),original);
    }
  }
  verify((await rows("select count(*)::int as n from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity"))[0].n,0);
  const evidence = { local_only:true, checks, backup_sha256:createHash('sha256').update(backupText).digest('hex'), restored_tables:Object.keys(backup.rows).length, credential_columns_excluded:['usuarios.password','Auth secrets'], integration:'passed', containment:'passed_without_deletion', prior_records:'preserved', production_writes:false };
  await writeFile(new URL('.local/approval/backup-restore-validation.json',root),JSON.stringify(evidence,null,2)+'\n');
  console.log(`Respaldo: ${checks} comprobaciones aprobadas; 16 tablas restauradas localmente, integración y contención sin borrar datos previos.`);
} catch (error) {
  console.error('Verificación local de respaldo/integración fallida:',error.message);
  process.exitCode=1;
} finally { await db.close(); }
