const q = (name) => '"' + name.replaceAll('"', '""') + '"';
export const createOriginal = async (db, snapshot) => {
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key,email text);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    create function auth.jwt() returns jsonb language sql stable as $$select jsonb_build_object('email',current_setting('request.jwt.claim.email',true))$$;
    grant usage on schema auth to authenticated,anon;`);
  for (const table of snapshot.tables) {
    const fields = table.columns.map((c) => q(c.name) + ' ' + (c.name === 'id' ? 'serial' : c.data_type) + (c.name !== 'id' && c.default_value ? ' default ' + c.default_value : '') + (!c.options.includes('nullable') ? ' not null' : ''));
    await db.exec(`create table ${table.name} (${fields.join(',')}); alter table ${table.name} enable row level security;`);
  }
  for (const c of snapshot.metadata.find((r) => r.section === 'constraints').details) await db.exec(`alter table public.${q(c.table)} add constraint ${q(c.name)} ${c.definition};`);
  await db.exec('grant all on all tables in schema public to anon,authenticated; grant all on all sequences in schema public to authenticated;');
  for (const p of snapshot.policies) {
    const using = p.qual ? ` using (${p.qual})` : '';
    const check = p.with_check ? ` with check (${p.with_check})` : '';
    await db.exec(`create policy ${q(p.policyname)} on public.${q(p.tablename)} for ${p.cmd} to authenticated${using}${check};`);
  }
};
