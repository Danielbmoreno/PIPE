import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://danielbmoreno.github.io',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
});

const getRequiredEnv = (name: string) => {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Falta la variable ${name} en la Edge Function.`);
  return value;
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }
  if (request.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);

  let createdAuthUserId: string | null = null;
  let createdProfileId: number | null = null;
  let adminClient: ReturnType<typeof createClient> | null = null;

  try {
    const supabaseUrl = getRequiredEnv('SUPABASE_URL');
    const anonKey = getRequiredEnv('SUPABASE_ANON_KEY');
    const serviceRoleKey = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY');
    const authorization = request.headers.get('Authorization');

    if (!authorization?.startsWith('Bearer ')) return json({ error: 'Autenticación requerida.' }, 401);

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false }
    });
    adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data: authData, error: authError } = await callerClient.auth.getUser();
    if (authError || !authData.user?.email) return json({ error: 'Sesión inválida.' }, 401);

    const { data: adminProfile, error: adminProfileError } = await adminClient
      .from('usuarios')
      .select('id,rol_id')
      .eq('correo', authData.user.email)
      .maybeSingle();
    if (adminProfileError) throw adminProfileError;
    if (!adminProfile || Number(adminProfile.rol_id) !== 1) return json({ error: 'Solo un administrador puede crear estudiantes.' }, 403);

    const body = await request.json();
    const nombre = String(body.nombre || '').trim();
    const codigo = String(body.codigo || '').trim();
    const correo = String(body.correo || '').trim().toLowerCase();
    const password = String(body.password || '');
    const programaId = Number(body.programa_id);
    const nivelRiesgo = String(body.nivel_riesgo || '').trim().toLowerCase();

    if (!nombre || !codigo || !correo || !password || !Number.isInteger(programaId) || !nivelRiesgo) {
      return json({ error: 'Todos los campos del estudiante son obligatorios.' }, 400);
    }
    if (!correo.endsWith('.edu')) return json({ error: 'El correo debe ser institucional (.edu).' }, 400);
    if (password.length < 6) return json({ error: 'La contraseña debe tener al menos 6 caracteres.' }, 400);
    if (!['bajo', 'medio', 'alto', 'critico'].includes(nivelRiesgo)) return json({ error: 'Nivel de riesgo inválido.' }, 400);

    const { data: existingCode, error: codeError } = await adminClient
      .from('estudiantes')
      .select('id')
      .eq('codigo', codigo)
      .maybeSingle();
    if (codeError) throw codeError;
    if (existingCode) return json({ error: 'El código estudiantil ya está registrado.' }, 409);

    const { data: existingProfile, error: profileCheckError } = await adminClient
      .from('usuarios')
      .select('id')
      .eq('correo', correo)
      .maybeSingle();
    if (profileCheckError) throw profileCheckError;
    if (existingProfile) return json({ error: 'El correo ya está registrado en usuarios.' }, 409);

    const { data: program, error: programError } = await adminClient
      .from('programas')
      .select('id')
      .eq('id', programaId)
      .maybeSingle();
    if (programError) throw programError;
    if (!program) return json({ error: 'El programa seleccionado no existe.' }, 400);

    const { data: authCreateData, error: authCreateError } = await adminClient.auth.admin.createUser({
      email: correo,
      password,
      email_confirm: true,
      user_metadata: { nombre, rol_id: 3 }
    });
    if (authCreateError || !authCreateData.user) {
      return json({ error: authCreateError?.message || 'No se pudo crear la cuenta de autenticación.' }, 409);
    }
    createdAuthUserId = authCreateData.user.id;

    const { data: profile, error: profileError } = await adminClient
      .from('usuarios')
      .insert({ nombre, correo, rol_id: 3, created_at: new Date().toISOString() })
      .select('id,nombre,correo,rol_id,created_at')
      .single();
    if (profileError || !profile) throw profileError || new Error('No se pudo crear el perfil del estudiante.');
    createdProfileId = profile.id;

    const { data: student, error: studentError } = await adminClient
      .from('estudiantes')
      .insert({ nombre, codigo, programa_id: programaId, usuario_id: createdProfileId, nivel_riesgo: nivelRiesgo, created_at: new Date().toISOString() })
      .select('id,nombre,codigo,programa_id,usuario_id,nivel_riesgo,created_at')
      .single();
    if (studentError || !student) throw studentError || new Error('No se pudo crear el estudiante.');

    return json({ message: 'Estudiante creado correctamente. La cuenta ya puede iniciar sesión.', usuario: profile, estudiante: student }, 201);
  } catch (error) {
    console.error('create-student rollback:', error);
    if (createdProfileId !== null && adminClient) {
      const { error: profileRollbackError } = await adminClient.from('usuarios').delete().eq('id', createdProfileId);
      if (profileRollbackError) console.error('No se pudo revertir usuarios:', profileRollbackError);
    }
    if (createdAuthUserId && adminClient) {
      const { error: authRollbackError } = await adminClient.auth.admin.deleteUser(createdAuthUserId);
      if (authRollbackError) console.error('No se pudo revertir Auth:', authRollbackError);
    }
    return json({ error: error instanceof Error ? error.message : 'No se pudo completar el alta del estudiante.' }, 500);
  }
});
