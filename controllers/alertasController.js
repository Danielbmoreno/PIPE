const supabase = require('../config/supabase');
const { sendSuccess, sendError } = require('./responseHelper');

const getAlertas = async (req, res) => {
  try {
    console.log('📌 GET /alertas');
    const { data, error } = await supabase
      .from('alertas')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;

    console.log(`✅ ${data?.length || 0} alertas obtenidas`);
    return sendSuccess(res, data, 'Alertas obtenidas correctamente');
  } catch (err) {
    console.error('❌ Error GET /alertas:', err);
    return sendError(res, err.message || 'Error al obtener alertas', 500);
  }
};

const createAlerta = async (req, res) => {
  try {
    const { estudiante_id, usuario_id, descripcion, nivel_riesgo } = req.body;
    console.log('📌 POST /alertas', { estudiante_id, nivel_riesgo });

    if (!estudiante_id) return sendError(res, 'estudiante_id es requerido', 400);
    if (!usuario_id) return sendError(res, 'usuario_id es requerido', 400);
    if (!descripcion || descripcion.trim() === '') return sendError(res, 'descripcion es requerida', 400);
    if (!nivel_riesgo || nivel_riesgo.trim() === '') return sendError(res, 'nivel_riesgo es requerido', 400);

    const { data, error } = await supabase
      .from('alertas')
      .insert([{ estudiante_id, usuario_id, descripcion: descripcion.trim(), nivel_riesgo: nivel_riesgo.trim() }])
      .select('*')
      .single();

    if (error) throw error;

    console.log(`✅ Alerta creada: ${data.id}`);
    return sendSuccess(res, data, 'Alerta creada correctamente', 201);
  } catch (err) {
    console.error('❌ Error POST /alertas:', err);
    return sendError(res, err.message || 'Error al crear alerta', 500);
  }
};

const updateAlerta = async (req, res) => {
  try {
    const { id } = req.params;
    const { descripcion, nivel_riesgo } = req.body;
    console.log(`📌 PUT /alertas/${id}`);

    const payload = {};
    if (descripcion && descripcion.trim()) payload.descripcion = descripcion.trim();
    if (nivel_riesgo && nivel_riesgo.trim()) payload.nivel_riesgo = nivel_riesgo.trim();

    if (Object.keys(payload).length === 0) {
      return sendError(res, 'Se debe enviar al menos un campo para actualizar', 400);
    }

    const { data, error } = await supabase
      .from('alertas')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    console.log(`✅ Alerta ${id} actualizada`);
    return sendSuccess(res, data, 'Alerta actualizada correctamente');
  } catch (err) {
    console.error('❌ Error PUT /alertas/:id:', err);
    return sendError(res, err.message || 'Error al actualizar alerta', 500);
  }
};

const deleteAlerta = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📌 DELETE /alertas/${id}`);

    const { error } = await supabase
      .from('alertas')
      .delete()
      .eq('id', id);

    if (error) throw error;

    console.log(`✅ Alerta ${id} eliminada`);
    return sendSuccess(res, { id }, 'Alerta eliminada correctamente');
  } catch (err) {
    console.error('❌ Error DELETE /alertas/:id:', err);
    return sendError(res, err.message || 'Error al eliminar alerta', 500);
  }
};

module.exports = { getAlertas, createAlerta, updateAlerta, deleteAlerta };
