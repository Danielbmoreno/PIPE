-- Politicas RLS para el rol admin de PIPE.
-- Ejecutar manualmente en Supabase. No desactiva RLS ni expone service_role.

create or replace function public.is_pipe_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.usuarios u
    where lower(u.correo) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and u.rol_id = 1
  );
$$;

revoke all on function public.is_pipe_admin() from public;
grant execute on function public.is_pipe_admin() to authenticated;

alter table public.usuarios enable row level security;
alter table public.estudiantes enable row level security;
alter table public.alertas enable row level security;
alter table public.casos enable row level security;
alter table public.citas enable row level security;
alter table public.intervenciones enable row level security;
alter table public.programas enable row level security;
alter table public.roles enable row level security;

create policy "pipe admin usuarios select" on public.usuarios for select to authenticated using (public.is_pipe_admin());
create policy "pipe admin usuarios insert" on public.usuarios for insert to authenticated with check (public.is_pipe_admin());
create policy "pipe admin usuarios update" on public.usuarios for update to authenticated using (public.is_pipe_admin()) with check (public.is_pipe_admin());
create policy "pipe admin usuarios delete" on public.usuarios for delete to authenticated using (public.is_pipe_admin());
create policy "pipe own usuario select" on public.usuarios for select to authenticated using (lower(correo) = lower(coalesce(auth.jwt() ->> 'email', '')));

create policy "pipe admin estudiantes select" on public.estudiantes for select to authenticated using (public.is_pipe_admin());
create policy "pipe admin estudiantes insert" on public.estudiantes for insert to authenticated with check (public.is_pipe_admin());
create policy "pipe admin estudiantes update" on public.estudiantes for update to authenticated using (public.is_pipe_admin()) with check (public.is_pipe_admin());
create policy "pipe admin estudiantes delete" on public.estudiantes for delete to authenticated using (public.is_pipe_admin());
create policy "pipe own estudiante select" on public.estudiantes for select to authenticated using (usuario_id = (select u.id from public.usuarios u where lower(u.correo) = lower(coalesce(auth.jwt() ->> 'email', ''))));

create policy "pipe admin alertas select" on public.alertas for select to authenticated using (public.is_pipe_admin());
create policy "pipe admin alertas insert" on public.alertas for insert to authenticated with check (public.is_pipe_admin());
create policy "pipe admin alertas update" on public.alertas for update to authenticated using (public.is_pipe_admin()) with check (public.is_pipe_admin());
create policy "pipe admin alertas delete" on public.alertas for delete to authenticated using (public.is_pipe_admin());

create policy "pipe admin casos select" on public.casos for select to authenticated using (public.is_pipe_admin());
create policy "pipe admin casos insert" on public.casos for insert to authenticated with check (public.is_pipe_admin());
create policy "pipe admin casos update" on public.casos for update to authenticated using (public.is_pipe_admin()) with check (public.is_pipe_admin());
create policy "pipe admin casos delete" on public.casos for delete to authenticated using (public.is_pipe_admin());

create policy "pipe admin citas select" on public.citas for select to authenticated using (public.is_pipe_admin());
create policy "pipe admin citas insert" on public.citas for insert to authenticated with check (public.is_pipe_admin());
create policy "pipe admin citas update" on public.citas for update to authenticated using (public.is_pipe_admin()) with check (public.is_pipe_admin());
create policy "pipe admin citas delete" on public.citas for delete to authenticated using (public.is_pipe_admin());
create policy "pipe own citas select" on public.citas for select to authenticated using (estudiante_id = (select e.id from public.estudiantes e join public.usuarios u on u.id = e.usuario_id where lower(u.correo) = lower(coalesce(auth.jwt() ->> 'email', ''))));

create policy "pipe admin intervenciones select" on public.intervenciones for select to authenticated using (public.is_pipe_admin());
create policy "pipe admin intervenciones insert" on public.intervenciones for insert to authenticated with check (public.is_pipe_admin());
create policy "pipe admin intervenciones update" on public.intervenciones for update to authenticated using (public.is_pipe_admin()) with check (public.is_pipe_admin());
create policy "pipe admin intervenciones delete" on public.intervenciones for delete to authenticated using (public.is_pipe_admin());

create policy "pipe authenticated programas select" on public.programas for select to authenticated using (true);
create policy "pipe authenticated roles select" on public.roles for select to authenticated using (true);
