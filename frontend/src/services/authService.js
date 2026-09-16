import { requireSupabase } from '../lib/supabase.js';

const getProfile = async (authUser) => {
	const { data, error } = await requireSupabase()
		.from('usuarios')
		.select('*, roles(nombre)')
		.eq('correo', authUser.email)
		.maybeSingle();

	if (error) throw error;
	if (!data) {
		return {
			uuid: authUser.id,
			correo: authUser.email,
			nombre: authUser.user_metadata?.nombre || authUser.email,
			rol_id: null
		};
	}

	return {
		...data,
		rol_id: data.roles?.nombre || null
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
