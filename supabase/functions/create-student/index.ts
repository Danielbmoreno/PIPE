import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.112.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://danielbmoreno.github.io',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
});
const getRequiredEnv = (name: string) => {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Falta la variable ${name} en la Edge Function.`);
  return value;
};
const institutionalEmail = (value: string) => /^[^\s@]+@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+edu(?:\.co)?$/i.test(value);
const createAdminClient = (url: string, key: string) => createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);
  let createdAuthUserId: string | null = null;
  let createdProfileId: number | null = null;
  let adminClient: ReturnType<typeof createAdminClient> | null = null;
  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) return json({ error: 'Autenticación requerida.' }, 401);
    const url = getRequiredEnv('SUPABASE_URL');
    const callerClient = createClient(url, getRequiredEnv('SUPABASE_ANON_KEY'), {
      global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data: authData, error: authError } = await callerClient.auth.getUser();
    if (authError || !authData.user) return json({ error: 'Sesión inválida.' }, 401);
    // Same active identity and RLS contract as the original frontend. No user_metadata role.
    const { data: scope, error: scopeError } = await callerClient.rpc('pipe_access_context');
    if (scopeError || scope?.version !== 1 || scope.rol_id !== 1 || !Number.isInteger(scope.usuario_id)) return json({ error: 'Se requiere un administrador activo con permisos verificados.' }, 403);
    adminClient = createAdminClient(url, getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'));
    const body = await request.json();
    const correo = String(body.correo || '').trim().toLowerCase();
    const password = String(body.password || '');
    if (!institutionalEmail(correo)) return json({ error: 'Ingresa el correo institucional real (.edu o .edu.co).' }, 400);
    if (password.length < 12) return json({ error: 'La contraseña individual inicial debe tener al menos 12 caracteres.' }, 400);
    // The operator must explicitly attest that the address belongs to this student.
    if (body.correo_verificado !== true) return json({ error: 'Confirma primero el correo y la identidad de la persona.' }, 400);
    // Provision an approved counselor profile without changing any existing Auth account.
    if (body.perfil_id !== undefined) {
      const profileId = Number(body.perfil_id);
      if (!Number.isInteger(profileId) || profileId <= 0) return json({ error: 'Perfil institucional inválido.' }, 400);
      const { data: target, error: targetError } = await adminClient.from('usuarios').select('id,nombre,correo,rol_id,activo,auth_user_id').eq('id', profileId).maybeSingle();
      if (targetError) throw targetError;
      if (!target || target.rol_id !== 2 || target.activo !== true) return json({ error: 'El perfil aprobado debe ser de consejería y estar activo.' }, 403);
      if (target.correo?.trim().toLowerCase() !== correo) return json({ error: 'El perfil no coincide con el correo verificado.' }, 409);
      if (target.auth_user_id !== null) {
        const { data: pending, error: pendingError } = await adminClient.auth.admin.getUserById(target.auth_user_id);
        if (pendingError || !pending.user || pending.user.email?.trim().toLowerCase() !== correo || pending.user.app_metadata?.pipe_estado !== 'pendiente_activacion_rls' || pending.user.app_metadata?.pipe_rol_previsto !== 2) return json({ error: 'Esta cuenta ya existe o no es un alta pendiente aprobada. No se cambiarán sus credenciales.' }, 409);
        const { error: activationError } = await adminClient.auth.admin.updateUserById(target.auth_user_id, { password, email_confirm: true, ban_duration: 'none', app_metadata: { ...pending.user.app_metadata, pipe_estado: 'activo' } });
        if (activationError) throw activationError;
        return json({ message: 'Nueva cuenta de consejería activada con su contraseña individual.', usuario: target });
      }
      const { data: created, error: createError } = await adminClient.auth.admin.createUser({ email: correo, password, email_confirm: true, user_metadata: { nombre: target.nombre } });
      if (createError || !created.user) return json({ error: 'No se creó la cuenta; revisa si el correo ya existe en Auth.' }, 409);
      createdAuthUserId = created.user.id;
      const { data: linked, error: linkError } = await adminClient.from('usuarios').update({ auth_user_id: createdAuthUserId }).eq('id', profileId).eq('rol_id', 2).is('auth_user_id', null).select('id,nombre,correo,rol_id,activo').single();
      if (linkError || !linked) throw linkError || new Error('No se vinculó el perfil de consejería.');
      return json({ message: 'Nueva cuenta de consejería creada sin cambiar cuentas anteriores.', usuario: linked }, 201);
    }
    let existingStudent: { id: number; nombre: string; usuario_id: number | null; correo: string | null } | null = null;
    if (body.estudiante_id !== undefined) {
      const id = Number(body.estudiante_id);
      if (!Number.isInteger(id) || id <= 0) return json({ error: 'Identificador académico inválido.' }, 400);
      const { data, error } = await adminClient.from('estudiantes').select('id,nombre,usuario_id,correo').eq('id', id).maybeSingle();
      if (error) throw error;
      if (!data) return json({ error: 'No existe el expediente seleccionado.' }, 404);
      if (data.usuario_id !== null) return json({ error: 'El expediente ya tiene una cuenta vinculada. No se modificarán sus credenciales.' }, 409);
      if (data.correo && data.correo.trim().toLowerCase() !== correo) return json({ error: 'El correo no coincide con el expediente verificado. Revisa la identidad antes de crear el acceso.' }, 409);
      existingStudent = data;
    }
    const nombre = existingStudent?.nombre || String(body.nombre || '').trim();
    const codigo = String(body.codigo || '').trim() || null;
    const programaId = Number(body.programa_id);
    const nivelRiesgo = String(body.nivel_riesgo || '').trim().toLowerCase() || null;
    if (!nombre || (!existingStudent && (!Number.isInteger(programaId) || programaId <= 0))) return json({ error: 'Indica nombre y programa académico.' }, 400);
    if (!existingStudent && nivelRiesgo && !['bajo', 'medio', 'alto', 'critico'].includes(nivelRiesgo)) return json({ error: 'Nivel de riesgo inválido.' }, 400);
    const { data: existingProfile, error: profileCheckError } = await adminClient.from('usuarios').select('id').eq('correo', correo).maybeSingle();
    if (profileCheckError) throw profileCheckError;
    if (existingProfile) return json({ error: 'Ya existe un perfil con este correo. Revisa su vínculo sin crear otra cuenta.' }, 409);
    if (!existingStudent) {
      if (codigo) {
        const { data, error } = await adminClient.from('estudiantes').select('id').eq('codigo', codigo).maybeSingle();
        if (error) throw error;
        if (data) return json({ error: 'El código ya está registrado. Usa el expediente existente.' }, 409);
      }
      // Refuse homonyms or spelling variants until an operator reviews identity.
      const { data: candidates, error: duplicateError } = await adminClient.from('estudiantes').select('id').ilike('nombre', nombre).limit(1);
      if (duplicateError) throw duplicateError;
      if (candidates?.length) return json({ error: 'Ya existe un expediente con este nombre. Revisa la identidad y usa Crear acceso.' }, 409);
      const { data: program, error: programError } = await adminClient.from('programas').select('id').eq('id', programaId).maybeSingle();
      if (programError) throw programError;
      if (!program) return json({ error: 'El programa no existe.' }, 400);
    }
    const { data: authCreateData, error: authCreateError } = await adminClient.auth.admin.createUser({ email: correo, password, email_confirm: true, user_metadata: { nombre } });
    if (authCreateError || !authCreateData.user) return json({ error: 'No se pudo crear la cuenta; revisa si el correo ya existe en Auth.' }, 409);
    createdAuthUserId = authCreateData.user.id;
    const { data: profile, error: profileError } = await adminClient.from('usuarios')
      .insert({ nombre, correo, rol_id: 3, activo: true, auth_user_id: createdAuthUserId })
      .select('id,nombre,correo,rol_id,activo').single();
    if (profileError || !profile) throw profileError || new Error('No se pudo crear el perfil institucional.');
    createdProfileId = profile.id;
    const academicWrite = existingStudent
      ? adminClient.from('estudiantes').update({ usuario_id: createdProfileId, ...(!existingStudent.correo ? { correo } : {}) }).eq('id', existingStudent.id).is('usuario_id', null)
      : adminClient.from('estudiantes').insert({ nombre, codigo, correo, programa_id: programaId, usuario_id: createdProfileId, nivel_riesgo: nivelRiesgo });
    const { data: student, error: studentError } = await academicWrite.select('id,nombre,codigo,correo,programa_id,usuario_id,nivel_riesgo,created_at,semestre,estado,institucion,sede,rendimiento_resumen,estado_acompanamiento').single();
    if (studentError || !student) throw studentError || new Error('No se vinculó el expediente; revisa si otra operación lo modificó.');
    return json({ message: 'Cuenta individual creada y vinculada al expediente.', usuario: profile, estudiante: student }, 201);
  } catch (error) {
    // Compensation is limited to identities created by this request. Never deletes an existing student.
    let profileRemoved = createdProfileId === null;
    if (createdProfileId !== null && adminClient) {
      const { error: rollbackError } = await adminClient.from('usuarios').delete().eq('id', createdProfileId);
      profileRemoved = !rollbackError;
    }
    if (createdAuthUserId && adminClient && profileRemoved) await adminClient.auth.admin.deleteUser(createdAuthUserId);
    console.error('create-student:', error instanceof Error ? error.message : 'Alta incompleta');
    return json({ error: 'No se pudo completar el alta. Revisa los registros de la operación antes de reintentar.' }, 500);
  }
});
