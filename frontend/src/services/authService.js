import { requireSupabase } from '../lib/supabase.js';

const roleMap = {
	1: 'admin',
	2: 'consejero',
	3: 'estudiante'
};

const getProfile = async (authUser) => {
	const { data, error } = await requireSupabase()
		.from('usuarios')
		.select('*')
		.eq('correo', authUser.email)
		.maybeSingle();

	if (error) throw error;
	if (!data) throw new Error(`No se encontró un perfil para ${authUser.email}`);

	const profile = data;
	const rol = roleMap[Number(profile.rol_id)];
	if (!rol) throw new Error(`El rol_id ${profile.rol_id} no corresponde a un rol válido`);

	return {
		...profile,
		rol_id: rol
	};
};

const login = async ({ correo, password }) => {
	const { data, error } = await requireSupabase().auth.signInWithPassword({
		email: correo,
		password
	});

	if (error) return { success: false, data: null, error: error.message };
	const usuario = await getProfile(data.user);
	return { success: true, data: { token: data.session.access_token, usuario }, error: null };
};

const getSession = async () => {
	const { data, error } = await requireSupabase().auth.getSession();
	if (error || !data.session?.user) return null;
	return {
		token: data.session.access_token,
		usuario: await getProfile(data.session.user)
	};
};

const logout = () => requireSupabase().auth.signOut();

export default { login, getSession, logout };
