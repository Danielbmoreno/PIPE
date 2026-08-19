const supabase = require('../config/supabase');
const { sendSuccess, sendError } = require('./responseHelper');

const getIntervenciones = async (req, res) => {
  try {
    console.log('📌 GET /intervenciones');
    const { data, error } = await supabase
      .from('intervenciones')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;

    console.log(`✅ ${data?.length || 0} intervenciones obtenidas`);
    return sendSuccess(res, data, 'Intervenciones obtenidas correctamente');
  } catch (err) {
    console.error('❌ Error GET /intervenciones:', err);
    return sendError(res, err.message || 'Error al obtener intervenciones', 500);
  }
};

const createIntervencion = async (req, res) => {
  try {
    const { caso_id, usuario_id, descripcion } = req.body;
    console.log('📌 POST /intervenciones', { caso_id });

    if (!caso_id) return sendError(res, 'caso_id es requerido', 400);
    if (!usuario_id) return sendError(res, 'usuario_id es requerido', 400);
    if (!descripcion || descripcion.trim() === '') return sendError(res, 'descripcion es requerida', 400);

    const { data, error } = await supabase
      .from('intervenciones')
      .insert([{ caso_id, usuario_id, descripcion: descripcion.trim() }])
      .select('*')
      .single();

    if (error) throw error;

    console.log(`✅ Intervención creada: ${data.id}`);
    return sendSuccess(res, data, 'Intervención creada correctamente', 201);
  } catch (err) {
    console.error('❌ Error POST /intervenciones:', err);
    return sendError(res, err.message || 'Error al crear intervención', 500);
  }
};

const updateIntervencion = async (req, res) => {
  try {
    const { id } = req.params;
    const { descripcion } = req.body;
    console.log(`📌 PUT /intervenciones/${id}`);

    if (!descripcion || descripcion.trim() === '') {
      return sendError(res, 'descripcion es requerida', 400);
    }

    const { data, error } = await supabase
      .from('intervenciones')
      .update({ descripcion: descripcion.trim() })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    console.log(`✅ Intervención ${id} actualizada`);
    return sendSuccess(res, data, 'Intervención actualizada correctamente');
  } catch (err) {
    console.error('❌ Error PUT /intervenciones/:id:', err);
    return sendError(res, err.message || 'Error al actualizar intervención', 500);
  }
};

const deleteIntervencion = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📌 DELETE /intervenciones/${id}`);

    const { error } = await supabase
      .from('intervenciones')
      .delete()
      .eq('id', id);

    if (error) throw error;

    console.log(`✅ Intervención ${id} eliminada`);
    return sendSuccess(res, { id }, 'Intervención eliminada correctamente');
  } catch (err) {
    console.error('❌ Error DELETE /intervenciones/:id:', err);
    return sendError(res, err.message || 'Error al eliminar intervención', 500);
  }
};

module.exports = {
  getIntervenciones,
  createIntervencion,
  updateIntervencion,
  deleteIntervencion
};