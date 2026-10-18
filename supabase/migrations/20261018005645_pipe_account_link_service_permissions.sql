-- The student-update trigger calls pipe_role() as the Edge Function's database
-- role. BYPASSRLS does not grant schema USAGE or function EXECUTE privileges.
-- Grant only the lookup needed by that trigger; keep browser grants and RLS.
grant usage on schema private to service_role;
grant execute on function private.pipe_role() to service_role;
