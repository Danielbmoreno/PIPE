const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { sendSuccess, sendError } = require('./responseHelper');

const jwtSecret = process.env.JWT_SECRET || 'PIPE_DEFAULT_SECRET';
const validRoles = ['admin', 'docente', 'consejero', 'estudiante'];

const register = async (req, res) => {
  const { nombre, correo, password, rol_id } = req.body;

  if (!nombre || !correo || !password || !rol_id) {
    return sendError(res, 'Todos los campos son requeridos', 400);
  }

  const email = String(correo).trim().toLowerCase();
  if (!email.endsWith('.edu')) {
    return sendError(res, 'Debe ingresar un correo institucional válido', 400);
  }

  if (!validRoles.includes(String(rol_id).toLowerCase())) {
    return sendError(res, 'Rol no válido', 400);
  }

  const existingUser = db.getAll('usuarios').find((user) => user.correo === email);
  if (existingUser) {
    return sendError(res, 'Correo ya registrado', 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const createdUser = db.insert('usuarios', {
    nombre: nombre.trim(),
    correo: email,
    password: hashedPassword,
    rol_id: String(rol_id).toLowerCase()
  });

  return sendSuccess(
    res,
    {
      id: createdUser.id,
      nombre: createdUser.nombre,
      correo: createdUser.correo,
      rol_id: createdUser.rol_id
    },
    'Usuario registrado correctamente',
    201
  );
};

const login = async (req, res) => {
  const { correo, password } = req.body;

  if (!correo || !password) {
    return sendError(res, 'Correo y contraseña son requeridos', 400);
  }

  const email = String(correo).trim().toLowerCase();
  if (!email.endsWith('.edu')) {
    return sendError(res, 'Debe ingresar un correo institucional válido', 400);
  }

  const user = db.getAll('usuarios').find((item) => item.correo === email);
  if (!user) {
    return sendError(res, 'Correo incorrecto o no registrado', 401);
  }

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) {
    return sendError(res, 'Contraseña incorrecta', 401);
  }

  const token = jwt.sign({ id: user.id, correo: user.correo, rol_id: user.rol_id }, jwtSecret, {
    expiresIn: '8h'
  });

  return sendSuccess(
    res,
    {
      token,
      usuario: {
        id: user.id,
        nombre: user.nombre,
        correo: user.correo,
        rol_id: user.rol_id
      }
    },
    'Inicio de sesión exitoso'
  );
};

module.exports = { register, login };
