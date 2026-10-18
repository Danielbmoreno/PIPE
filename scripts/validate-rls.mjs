import { createOriginal } from './lib/rls-fixture.mjs';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '../.local/validation/node_modules/@electric-sql/pglite/dist/index.js';
const db = new PGlite();
const snapshot = JSON.parse(await readFile(new URL('../supabase/proposals/schema-observado.json', import.meta.url), 'utf8'));
const proposal = await readFile(new URL('../supabase/proposals/01_acompanamiento_y_permisos.sql', import.meta.url), 'utf8');
const q = (name) => '"' + name.replaceAll('"', '""') + '"';
let checks = 0;
const verify = (value, expected) => { assert.deepEqual(value, expected); checks++; };

try {
  await createOriginal(db, snapshot);
  // A plain execution must stop before any schema changes without approval.
  await assert.rejects(db.exec(proposal), /pendiente de aprobación/); checks++;
  await db.exec('rollback;');
  await db.exec(proposal.replace('-- set local pipe.approved', 'set local pipe.approved'));
  console.log('SQL propuesto aplicado únicamente a PostgreSQL local en memoria.');
  const ids = [1,2,3,4,5].map((n) => `00000000-0000-0000-0000-${String(n).padStart(12,'0')}`);
  for (let i=0;i<5;i++) await db.query('insert into auth.users values($1,$2)',[ids[i],`fixture${i+1}@example.edu`]);
  await db.exec(`insert into public.roles(id,nombre) values(1,'admin'),(2,'consejero'),(3,'estudiante');
    insert into public.programas(id,nombre) values(1,'Programa de prueba');
    insert into public.usuarios(id,nombre,correo,rol_id,auth_user_id) values
      (1,'Administrador de prueba','fixture1@example.edu',1,'${ids[0]}'),
      (2,'Consejero A','fixture2@example.edu',2,'${ids[1]}'),(3,'Consejero B','fixture3@example.edu',2,'${ids[2]}'),
      (4,'Estudiante A','fixture4@example.edu',3,'${ids[3]}'),(5,'Estudiante B','fixture5@example.edu',3,'${ids[4]}');
    insert into public.estudiantes(id,nombre,usuario_id,programa_id) values(101,'Estudiante A',4,1),(102,'Estudiante B',5,1);
    insert into public.consejero_estudiantes(consejero_id,estudiante_id) values(2,101),(3,102);
    insert into public.alertas(id,estudiante_id,usuario_id,descripcion) values(1,101,2,'Prueba A'),(2,102,3,'Prueba B');
    insert into public.casos(id,estudiante_id,usuario_id,alerta_id,descripcion,estado) values(1,101,2,1,'Caso A','abierto'),(2,102,3,2,'Caso B','abierto');
    insert into public.citas(id,estudiante_id,usuario_id,consejero_id,caso_id,fecha,hora,hora_fin,estado,motivo) values(1,101,2,2,1,current_date+1,'17:00','18:00','programada','Prueba A'),(2,102,3,3,2,current_date+1,'17:00','18:00','programada','Prueba B');
    insert into public.intervenciones(id,caso_id,usuario_id,descripcion) values(1,1,2,'Intervención A'),(2,2,3,'Intervención B');
    insert into public.consultas(estudiante_id,usuario_id,caso_id,fecha,tipo,descripcion) values(101,2,1,current_date,'consulta','Consulta A'),(102,3,2,current_date,'consulta','Consulta B');
    insert into public.seguimientos(estudiante_id,usuario_id,fecha,descripcion) values(101,2,current_date,'Compromiso A'),(102,3,current_date,'Compromiso B');`);
  for (const table of snapshot.tables) await db.exec(`select setval(pg_get_serial_sequence('${table.name}','id'), greatest(coalesce((select max(id) from ${table.name.split('.').map(q).join('.')}),0),1));`);
  const login = async (n) => { await db.exec('reset role;'); await db.query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claim.email',$2,false)",[ids[n-1],`fixture${n}@example.edu`]); await db.exec('set role authenticated;'); };
  const rows = async (sql) => (await db.query(sql)).rows;
  // Execute the real policies for each CRUD operation. Roll back every test
  // mutation so it cannot alter later fixture counts or the private batch.
  const isolated = async (work) => {
    await db.exec('begin;');
    try { await work(); } finally { await db.exec('rollback;'); }
  };
  const crud = [
    ['alertas', 'descripcion', (student, actor) => `insert into public.alertas(estudiante_id,usuario_id,descripcion) values(${student},${actor},'Prueba CRUD') returning id`],
    ['casos', 'descripcion', (student, actor) => `insert into public.casos(estudiante_id,usuario_id,descripcion,estado) values(${student},${actor},'Prueba CRUD','abierto') returning id`],
    ['citas', 'motivo', (student, actor) => `insert into public.citas(estudiante_id,usuario_id,consejero_id,fecha,hora,hora_fin,estado,motivo) values(${student},${actor},${student === 101 ? 2 : 3},current_date+3,'10:00','11:00','programada','Prueba CRUD') returning id`],
    ['intervenciones', 'descripcion', (student, actor) => `insert into public.intervenciones(caso_id,usuario_id,descripcion) values(${student === 101 ? 1 : 2},${actor},'Prueba CRUD') returning id`],
    ['consultas', 'descripcion', (student, actor) => `insert into public.consultas(estudiante_id,usuario_id,fecha,tipo,descripcion) values(${student},${actor},current_date,'consulta','Prueba CRUD') returning id`],
    ['seguimientos', 'descripcion', (student, actor) => `insert into public.seguimientos(estudiante_id,usuario_id,fecha,descripcion) values(${student},${actor},current_date,'Prueba CRUD') returning id`]
  ];
  for (const [table, field, insert] of crud) {
    await login(2);
    await isolated(async () => {
      const created = (await rows(insert(101, 2)))[0]; verify(Boolean(created.id), true);
      verify((await rows(`update public.${table} set ${field}='Edición autorizada' where id=${created.id} returning id`)).length, 1);
      verify((await rows(`delete from public.${table} where id=${created.id} returning id`)).length, 0);
      verify((await rows(`select id from public.${table} where id=${created.id}`)).length, 1);
      verify((await rows(`update public.${table} set ${field}='Edición ajena' where id=2 returning id`)).length, 0);
      verify((await rows(`delete from public.${table} where id=2 returning id`)).length, 0);
    });
    await isolated(async () => { await assert.rejects(db.exec(insert(102, 2)), /row-level security|Profesional sin asignación/); checks++; });
    await login(4);
    await isolated(async () => {
      verify((await rows(`update public.${table} set ${field}='Edición estudiante' where id=1 returning id`)).length, 0);
      verify((await rows(`delete from public.${table} where id=1 returning id`)).length, 0);
    });
    await isolated(async () => { await assert.rejects(db.exec(insert(101, 4)), /row-level security|Profesional sin asignación/); checks++; });
    await login(1);
    await isolated(async () => {
      const created = (await rows(insert(101, 1)))[0]; verify(Boolean(created.id), true);
      verify((await rows(`update public.${table} set ${field}='Edición administrador' where id=${created.id} returning id`)).length, 1);
      verify((await rows(`delete from public.${table} where id=${created.id} returning id`)).length, 1);
    });
    await db.exec('reset role; set role anon;');
    for (const sql of [`select id from public.${table}`, insert(101, 1), `update public.${table} set ${field}='Anónimo' where id=1`, `delete from public.${table} where id=1`]) {
      await isolated(async () => { await assert.rejects(db.exec(sql), /permission denied/); checks++; });
    }
  }
  await login(2);
  for (const table of ['estudiantes','citas','casos','intervenciones','consultas','seguimientos']) verify((await rows(`select count(*)::int as n from public.${table}`))[0].n,1);
  verify((await rows('select public.pipe_access_context() as c'))[0].c.estudiante_ids,[101]);
  await assert.rejects(db.exec("insert into public.consultas(estudiante_id,usuario_id,fecha,tipo,descripcion) values(102,2,current_date,'consulta','No permitido')")); checks++;
  await assert.rejects(db.exec("insert into public.consultas(estudiante_id,usuario_id,fecha,tipo,descripcion) values(101,3,current_date,'consulta','Autor ajeno')")); checks++;
  await assert.rejects(db.exec("update public.estudiantes set nombre='Cambio no autorizado' where id=101")); checks++;
  await db.exec('update public.estudiantes set semestre=10 where id=101;');
  verify((await rows('select semestre from public.estudiantes where id=101'))[0].semestre,10);
  await assert.rejects(db.exec('insert into public.consejero_estudiantes values(2,102,true,now())')); checks++;
  await assert.rejects(db.exec('select password from public.usuarios')); checks++;
  await db.exec('update public.usuarios set rol_id=1 where id=2;');
  verify((await rows('select rol_id from public.usuarios where id=2'))[0].rol_id,2);
  await assert.rejects(db.exec("insert into public.consultas(estudiante_id,usuario_id,fecha,tipo,descripcion) values(101,2,current_date+2,'consulta','Atención futura')")); checks++;
  await assert.rejects(db.exec("update public.citas set estado='atendida' where id=1")); checks++;
  await assert.rejects(db.exec("insert into public.citas(estudiante_id,usuario_id,consejero_id,fecha,hora,hora_fin,estado,motivo) values(101,2,2,current_date+1,'17:30','18:30','programada','Choque de agenda')"), /superpone/); checks++;
  await assert.rejects(db.exec("update public.consultas set usuario_id=3 where estudiante_id=101"), /autoría/); checks++;
  await login(4);
  verify((await rows('select id from public.estudiantes')).map((r) => r.id),[101]);
  for (const table of ['alertas','casos','intervenciones']) verify((await rows(`select count(*)::int as n from public.${table}`))[0].n,0);
  verify((await rows('select count(*)::int as n from public.consultas'))[0].n,1);
  await assert.rejects(db.exec("insert into public.consultas(estudiante_id,usuario_id,fecha,tipo,descripcion) values(101,4,current_date,'consulta','No permitido')")); checks++;
  await login(1);
  verify((await rows('select count(*)::int as n from public.estudiantes'))[0].n,2);
  await assert.rejects(db.exec('update public.casos set alerta_id=2 where id=1')); checks++;
  await assert.rejects(db.exec('update public.consultas set estudiante_id=102 where estudiante_id=101'), /conservar/); checks++;
  await assert.rejects(db.exec('update public.intervenciones set caso_id=2 where id=1'), /conservar/); checks++;
  await assert.rejects(db.exec("update public.seguimientos set estado='completado',fecha=current_date+2,realizado_en=now() where estudiante_id=101"), /futuros/); checks++;
  await assert.rejects(db.exec("insert into public.consultas(estudiante_id,usuario_id,cita_id,fecha,tipo,descripcion) values(101,1,2,current_date,'consulta','Cita ajena')"), /otro estudiante/); checks++;
  await db.exec('update public.consejero_estudiantes set activo=false where consejero_id=2 and estudiante_id=101;');
  await login(2);
  verify((await rows('select count(*)::int as n from public.estudiantes'))[0].n,0);
  await db.exec('reset role; set role anon;');
  await assert.rejects(db.exec('select * from public.estudiantes')); checks++;
  await assert.rejects(db.exec('truncate public.estudiantes cascade')); checks++;
  await db.exec('reset role;');
  const dataProposal = await readFile(new URL('../.local/approval/02_incorporacion_pendiente.sql', import.meta.url), 'utf8').catch(() => null);
  if (dataProposal) {
    const counselorPlan = JSON.parse(await readFile(new URL('../.local/approval/registros-previstos.json', import.meta.url), 'utf8')).nueva_consejera;
    const newCounselorEmail = counselorPlan.correo;
    // Exercise the private proposal solely inside this disposable database.
    await assert.rejects(db.exec(dataProposal), /Falta aprobación/); checks++;
    await db.exec('rollback;');
    await db.exec("update public.usuarios set nombre='Cuenta anterior de prueba',rol_id=1 where id=2; update public.programas set nombre='Ingeniería de Sistemas' where id=1;");
    for (const table of snapshot.tables) {
      await db.exec(`select setval(pg_get_serial_sequence('${table.name}','id'), greatest(coalesce((select max(id) from ${table.name.split('.').map(q).join('.')}),0),1));`);
    }
    const approvedLocally = dataProposal.replaceAll('-- set local pipe.approved', 'set local pipe.approved');
    const counts = async () => (await rows('select (select count(*)::int from estudiantes) as estudiantes,(select count(*)::int from citas) as citas,(select count(*)::int from casos) as casos,(select count(*)::int from seguimientos) as seguimientos'))[0];
    const before = await counts();
    await db.exec(approvedLocally);
    const after = await counts();
    verify(Object.fromEntries(Object.entries(after).map(([key,value]) => [key,value-before[key]])), { estudiantes:4, citas:5, casos:4, seguimientos:4 });
    verify((await rows('select rol_id from public.usuarios where id=2'))[0].rol_id,1);
    verify((await rows("select count(*)::int as n from public.citas where estudiante_id not in (101,102) and (estado<>'programada' or hora<>time '17:00' or hora_fin<>time '18:00')"))[0].n,0);
    await db.exec(approvedLocally);
    verify(await counts(), after);
    const newCounselorAuth = '00000000-0000-0000-0000-000000000006';
    await db.query('insert into auth.users values($1,$2)',[newCounselorAuth,newCounselorEmail]);
    await db.query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claim.email',$2,false)",[newCounselorAuth,newCounselorEmail]);
    await db.exec('set role authenticated;');
    verify((await rows('select public.pipe_access_context() as c'))[0].c.rol_id,2);
    verify((await rows('select count(*)::int as n from estudiantes'))[0].n,4);
    verify((await rows('select count(*)::int as n from estudiantes where id in (101,102)'))[0].n,0);
    await db.exec('reset role;');

    console.log('Lote privado: guardia de aprobación, cantidades previstas, horarios e idempotencia verificados localmente.');
    const combined = await readFile(new URL('../.local/approval/00_transaccion_completa_pendiente.sql', import.meta.url), 'utf8');
    const atomic = new PGlite();
    try {
      await createOriginal(atomic, snapshot);
      await atomic.exec(`insert into auth.users values('${ids[0]}','fixture1@example.edu'),('${ids[1]}','fixture2@example.edu');
        insert into roles(id,nombre) values(1,'admin'),(2,'consejero'),(3,'estudiante');
        insert into programas(id,nombre) values(1,'Ingeniería de Sistemas');
        insert into usuarios(id,nombre,correo,rol_id) values(1,'Administrador de prueba','fixture1@example.edu',1),(2,'Cuenta anterior de prueba','fixture2@example.edu',1);
        select setval(pg_get_serial_sequence('public.usuarios','id'),2);`);
      await atomic.exec('alter table auth.users add column banned_until timestamptz; alter table auth.users add column raw_app_meta_data jsonb;');
      await atomic.query("insert into auth.users(id,email,banned_until,raw_app_meta_data) values($1,$2,now()+interval '100 years',$3)",[counselorPlan.auth_user_id,newCounselorEmail,{pipe_estado:'pendiente_activacion_rls',pipe_rol_previsto:2}]);
      await atomic.query('insert into usuarios(id,nombre,correo,rol_id,activo) values($1,$2,$3,2,false)',[counselorPlan.usuario_id,counselorPlan.nombre,newCounselorEmail]);
      await atomic.query("select setval(pg_get_serial_sequence('public.usuarios','id'),$1)",[counselorPlan.usuario_id]);
      // A missing data decision must also roll back every preceding schema change.
      await assert.rejects(atomic.exec(combined.replace('-- set local pipe.approved =', 'set local pipe.approved =')), /Falta aprobación/); checks++;
      await atomic.exec('rollback;');
      verify((await atomic.query("select count(*)::int as n from information_schema.columns where table_schema='public' and table_name='estudiantes' and column_name='institucion'")).rows[0].n,0);
      verify((await atomic.query('select rol_id from usuarios where id=2')).rows[0].rol_id,1);
      await atomic.exec(combined.replaceAll('-- set local pipe.approved', 'set local pipe.approved'));
      verify((await atomic.query('select (select count(*)::int from estudiantes) as estudiantes,(select count(*)::int from citas) as citas')).rows[0],{estudiantes:4,citas:5});
      verify((await atomic.query('select rol_id from usuarios where id=2')).rows[0].rol_id,1);
      verify((await atomic.query('select rol_id from usuarios where correo=$1',[newCounselorEmail])).rows[0].rol_id,2);
      verify((await atomic.query('select activo,auth_user_id from usuarios where correo=$1',[newCounselorEmail])).rows[0],{activo:true,auth_user_id:counselorPlan.auth_user_id});
      verify((await atomic.query('select banned_until>now() as blocked from auth.users where id=$1',[counselorPlan.auth_user_id])).rows[0].blocked,true);
      console.log('Transacción combinada: rollback completo sin aprobación y activación coordinada verificados localmente.');
    } finally { await atomic.close(); }

  }
  console.log(`RLS: ${checks} verificaciones aprobadas; aislamiento, permisos, relaciones, fechas y revocación.`);
} catch (error) {
  console.error('Validación local fallida:', error.message);
  process.exitCode = 1;
} finally { await db.close(); }
