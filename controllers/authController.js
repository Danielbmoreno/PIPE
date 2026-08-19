const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const { success, error } = require('./responseHelper');

const register = async (req, res) => {
  const { nombre, correo, password, rol_id } = req.body;

  if (!nombre || !correo || !password || !rol_id) {
    return error(res, 400, 'Todos los campos son requeridos');
  }

  const { data: existingUser, error: existingError } = await supabase
    .from('usuarios')
    .select('id')
    .eq('correo', correo)
    .single();

  if (existingError && existingError.code !== 'PGRST116') {
    return error(res, 500, 'Error al verificar usuario');
  }

  if (existingUser) {
    return res.status(409).json({ error: 'Correo ya registrado' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const { data, error } = await supabase
    .from('usuarios')
    .insert([{ nombre, correo, password: hashedPassword, rol_id }])
    .select('id, nombre, correo, rol_id')
    .single();

  if (error) {
    return error(res, 500, 'Error al registrar usuario');
  }

  return success(res, data, 'Usuario registrado correctamente', 201);
};

const login = async (req, res) => {
  const { correo, password } = req.body;

  if (!correo || !password) {
    return error(res, 400, 'Correo y contraseña son requeridos');
  }

  const { data: user, error } = await supabase
    .from('usuarios')
    .select('id, nombre, correo, password, rol_id')
    .eq('correo', correo)
    .single();

  if (error || !user) {
    return error(res, 401, 'Credenciales inválidas');
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return error(res, 401, 'Credenciales inválidas');
  }

  const token = jwt.sign({ id: user.id, correo: user.correo, rol_id: user.rol_id }, process.env.JWT_SECRET, {
    expiresIn: '8h'
  });

  return success(res, { token, usuario: { id: user.id, nombre: user.nombre, correo: user.correo, rol_id: user.rol_id } }, 'Inicio de sesión exitoso');
};

module.exports = { register, login };
