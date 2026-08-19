const supabase = require('../config/supabase');
const { sendSuccess, sendError } = require('./responseHelper');

const getEstudiantes = async (req, res) => {
  try {
    console.log('📌 GET /estudiantes');
    const { data, error } = await supabase
      .from('estudiantes')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;

    console.log(`✅ ${data?.length || 0} estudiantes obtenidos`);
    return sendSuccess(res, data, 'Estudiantes obtenidos correctamente');
  } catch (err) {
    console.error('❌ Error GET /estudiantes:', err);
    return sendError(res, err.message || 'Error al obtener estudiantes', 500);
  }
};

const getEstudianteById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📌 GET /estudiantes/${id}`);

    const { data, error } = await supabase
      .from('estudiantes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
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
    const { nombre, codigo, programa, semestre, nivel_riesgo } = req.body;
    console.log('📌 POST /estudiantes', { nombre, codigo });

    if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
      return sendError(res, 'Nombre es requerido y debe ser texto', 400);
    }
    if (!codigo || typeof codigo !== 'string' || codigo.trim() === '') {
      return sendError(res, 'Código es requerido y debe ser texto', 400);
    }

    const payload = {
      nombre: nombre.trim(),
      codigo: codigo.trim()
    };

    if (programa && programa.trim()) payload.programa = programa.trim();
    if (semestre) payload.semestre = parseInt(semestre);
    if (nivel_riesgo && nivel_riesgo.trim()) payload.nivel_riesgo = nivel_riesgo.trim();

    const { data, error } = await supabase
      .from('estudiantes')
      .insert([payload])
      .select('*')
      .single();

    if (error) throw error;

    console.log(`✅ Estudiante creado: ${data.id}`);
    return sendSuccess(res, data, 'Estudiante creado correctamente', 201);
  } catch (err) {
    console.error('❌ Error POST /estudiantes:', err);
    return sendError(res, err.message || 'Error al crear estudiante', 500);
  }
};

const updateEstudiante = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, codigo, programa, semestre, nivel_riesgo } = req.body;
    console.log(`📌 PUT /estudiantes/${id}`);

    const payload = {};
    if (nombre && nombre.trim()) payload.nombre = nombre.trim();
    if (codigo && codigo.trim()) payload.codigo = codigo.trim();
    if (programa && programa.trim()) payload.programa = programa.trim();
    if (semestre) payload.semestre = parseInt(semestre);
    if (nivel_riesgo && nivel_riesgo.trim()) payload.nivel_riesgo = nivel_riesgo.trim();

    if (Object.keys(payload).length === 0) {
      return sendError(res, 'Se debe enviar al menos un campo para actualizar', 400);
    }

    const { data, error } = await supabase
      .from('estudiantes')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    console.log(`✅ Estudiante ${id} actualizado`);
    return sendSuccess(res, data, 'Estudiante actualizado correctamente');
  } catch (err) {
    console.error('❌ Error PUT /estudiantes/:id:', err);
    return sendError(res, err.message || 'Error al actualizar estudiante', 500);
  }
};

const deleteEstudiante = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📌 DELETE /estudiantes/${id}`);

    const { error } = await supabase
      .from('estudiantes')
      .delete()
      .eq('id', id);

    if (error) throw error;

    console.log(`✅ Estudiante ${id} eliminado`);
    return sendSuccess(res, { id }, 'Estudiante eliminado correctamente');
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
