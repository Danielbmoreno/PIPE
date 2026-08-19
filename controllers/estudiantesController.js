const db = require('../config/db');
const bcrypt = require('bcrypt');
const { sendSuccess, sendError } = require('./responseHelper');

const getEstudiantes = (req, res) => {
  try {
    console.log('📌 GET /estudiantes');
    const data = db.getAll('estudiantes').sort((a, b) => b.id - a.id);

    console.log(`✅ ${data.length} estudiantes obtenidos`);
    return sendSuccess(res, data, 'Estudiantes obtenidos correctamente');
  } catch (err) {
    console.error('❌ Error GET /estudiantes:', err);
    return sendError(res, err.message || 'Error al obtener estudiantes', 500);
  }
};

const getEstudianteById = (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📌 GET /estudiantes/${id}`);

    const data = db.getById('estudiantes', id);
    if (!data) return sendError(res, 'Estudiante no encontrado', 404);

    console.log(`✅ Estudiante ${id} obtenido`);
    return sendSuccess(res, data, 'Estudiante obtenido');
  } catch (err) {
    console.error('❌ Error GET /estudiantes/:id:', err);
    return sendError(res, err.message || 'Error al obtener estudiante', 500);
  }
};

const createEstudiante = async (req, res) => {
  try {
    const { nombre, codigo, programa, semestre, nivel_riesgo, correo, password } = req.body;
    console.log('📌 POST /estudiantes', { nombre, codigo, correo });

    if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
      return sendError(res, 'Nombre es requerido y debe ser texto', 400);
    }
    if (!codigo || typeof codigo !== 'string' || codigo.trim() === '') {
      return sendError(res, 'Código es requerido y debe ser texto', 400);
    }

    // correo institucional: si no viene, se genera a partir del código
    const email = correo && String(correo).trim().toLowerCase()
      ? String(correo).trim().toLowerCase()
      : `${String(codigo).trim().toLowerCase()}@universidad.edu`;

    if (!email.endsWith('.edu')) {
      return sendError(res, 'El correo debe ser institucional (.edu)', 400);
    }

    // verificar unicidad de correo
    const existingUser = db.getAll('usuarios').find((u) => String(u.correo).toLowerCase() === email);
    if (existingUser) {
      return sendError(res, 'Correo ya registrado', 409);
    }

    // generar contraseña si no viene
    const plainPassword = password && String(password).trim() !== '' ? String(password) : Math.random().toString(36).slice(-8) + 'A1';
    const hashed = await bcrypt.hash(plainPassword, 10);

    // crear usuario
    const usuarioPayload = {
      nombre: String(nombre).trim(),
      correo: email,
      password: hashed,
      password_hash: hashed,
      rol_id: 'estudiante',
      activo: true,
      created_at: new Date().toISOString(),
      ultimo_login: null
    };

    const createdUser = db.insert('usuarios', usuarioPayload);

    // crear registro de estudiante vinculado
    const estudiantePayload = {
      usuario_id: createdUser.id,
      nombre: String(nombre).trim(),
      correo: email,
      codigo: String(codigo).trim(),
      codigo_estudiante: String(codigo).trim(),
      programa: programa ? String(programa).trim() : '',
      semestre: semestre ? Number(semestre) : null,
      nivel_riesgo: nivel_riesgo ? String(nivel_riesgo).trim() : '',
      estado: 'activo',
      created_at: new Date().toISOString()
    };

    const createdEstudiante = db.insert('estudiantes', estudiantePayload);

    console.log(`✅ Usuario creado: ${createdUser.id} - Estudiante creado: ${createdEstudiante.id}`);

    // devolver también la contraseña generada (solo en entorno dev)
    const responseData = { ...createdEstudiante, usuario: { id: createdUser.id, correo: createdUser.correo } };
    responseData.plain_password = plainPassword;

    return sendSuccess(res, responseData, 'Estudiante y usuario creados correctamente', 201);
  } catch (err) {
    console.error('❌ Error POST /estudiantes:', err);
    return sendError(res, err.message || 'Error al crear estudiante', 500);
  }
};

const updateEstudiante = (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, codigo, programa, semestre, nivel_riesgo } = req.body;
    console.log(`📌 PUT /estudiantes/${id}`);

    const payload = {};
    if (nombre && nombre.trim()) payload.nombre = nombre.trim();
    if (codigo && codigo.trim()) payload.codigo = codigo.trim();
    if (programa && programa.trim()) payload.programa = programa.trim();
    if (semestre !== undefined) payload.semestre = semestre === '' ? null : Number(semestre);
    if (nivel_riesgo && nivel_riesgo.trim()) payload.nivel_riesgo = nivel_riesgo.trim();

    if (Object.keys(payload).length === 0) {
      return sendError(res, 'Se debe enviar al menos un campo para actualizar', 400);
    }

    const data = db.update('estudiantes', id, payload);
    if (!data) {
      return sendError(res, 'Estudiante no encontrado', 404);
    }

    console.log(`✅ Estudiante ${id} actualizado`);
    return sendSuccess(res, data, 'Estudiante actualizado correctamente');
  } catch (err) {
    console.error('❌ Error PUT /estudiantes/:id:', err);
    return sendError(res, err.message || 'Error al actualizar estudiante', 500);
  }
};

const deleteEstudiante = (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📌 DELETE /estudiantes/${id}`);

    const deleted = db.remove('estudiantes', id);
    if (!deleted) {
      return sendError(res, 'Estudiante no encontrado', 404);
    }

    console.log(`✅ Estudiante ${id} eliminado`);
    return sendSuccess(res, { id: Number(id) }, 'Estudiante eliminado correctamente');
  } catch (err) {
    console.error('❌ Error DELETE /estudiantes/:id:', err);
    return sendError(res, err.message || 'Error al eliminar estudiante', 500);
  }
};

module.exports = {
  getEstudiantes,
  getEstudianteById,
  createEstudiante,
  updateEstudiante,
  deleteEstudiante
};
