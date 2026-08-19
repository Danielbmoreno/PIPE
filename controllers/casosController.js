const supabase = require('../config/supabase');
const { sendSuccess, sendError } = require('./responseHelper');

const getCasos = async (req, res) => {
  try {
    console.log('📌 GET /casos');
    const { data, error } = await supabase
      .from('casos')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;

    console.log(`✅ ${data?.length || 0} casos obtenidos`);
    return sendSuccess(res, data, 'Casos obtenidos correctamente');
  } catch (err) {
    console.error('❌ Error GET /casos:', err);
    return sendError(res, err.message || 'Error al obtener casos', 500);
  }
};

const createCaso = async (req, res) => {
  try {
    const { estudiante_id, usuario_id, descripcion, estado } = req.body;
    console.log('📌 POST /casos', { estudiante_id, estado });

    if (!estudiante_id) return sendError(res, 'estudiante_id es requerido', 400);
    if (!usuario_id) return sendError(res, 'usuario_id es requerido', 400);
    if (!descripcion || descripcion.trim() === '') return sendError(res, 'descripcion es requerida', 400);
    if (!estado || estado.trim() === '') return sendError(res, 'estado es requerido', 400);

    const { data, error } = await supabase
      .from('casos')
      .insert([{ estudiante_id, usuario_id, descripcion: descripcion.trim(), estado: estado.trim() }])
      .select('*')
      .single();

    if (error) throw error;

    console.log(`✅ Caso creado: ${data.id}`);
    return sendSuccess(res, data, 'Caso creado correctamente', 201);
  } catch (err) {
    console.error('❌ Error POST /casos:', err);
    return sendError(res, err.message || 'Error al crear caso', 500);
  }
};

const updateCaso = async (req, res) => {
  try {
    const { id } = req.params;
    const { descripcion, estado } = req.body;
    console.log(`📌 PUT /casos/${id}`);

    const payload = {};
    if (descripcion && descripcion.trim()) payload.descripcion = descripcion.trim();
    if (estado && estado.trim()) payload.estado = estado.trim();

    if (Object.keys(payload).length === 0) {
      return sendError(res, 'Se debe enviar al menos un campo para actualizar', 400);
    }

    const { data, error } = await supabase
      .from('casos')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    console.log(`✅ Caso ${id} actualizado`);
    return sendSuccess(res, data, 'Caso actualizado correctamente');
  } catch (err) {
    console.error('❌ Error PUT /casos/:id:', err);
    return sendError(res, err.message || 'Error al actualizar caso', 500);
  }
};

const deleteCaso = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📌 DELETE /casos/${id}`);

    const { error } = await supabase
      .from('casos')
      .delete()
      .eq('id', id);

    if (error) throw error;

    console.log(`✅ Caso ${id} eliminado`);
    return sendSuccess(res, { id }, 'Caso eliminado correctamente');
  } catch (err) {
    console.error('❌ Error DELETE /casos/:id:', err);
    return sendError(res, err.message || 'Error al eliminar caso', 500);
  }
};

module.exports = { getCasos, createCaso, updateCaso, deleteCaso };
