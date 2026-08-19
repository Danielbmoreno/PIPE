const supabase = require('../config/supabase');
const { sendSuccess, sendError } = require('./responseHelper');

const getCitas = async (req, res) => {
  try {
    console.log('📌 GET /citas');
    const { data, error } = await supabase
      .from('citas')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;

    console.log(`✅ ${data?.length || 0} citas obtenidas`);
    return sendSuccess(res, data, 'Citas obtenidas correctamente');
  } catch (err) {
    console.error('❌ Error GET /citas:', err);
    return sendError(res, err.message || 'Error al obtener citas', 500);
  }
};

const createCita = async (req, res) => {
  try {
    const { estudiante_id, usuario_id, fecha, hora, motivo, estado } = req.body;
    console.log('📌 POST /citas', { estudiante_id, fecha, hora });

    if (!estudiante_id) return sendError(res, 'estudiante_id es requerido', 400);
    if (!usuario_id) return sendError(res, 'usuario_id es requerido', 400);
    if (!fecha) return sendError(res, 'fecha es requerida', 400);
    if (!hora) return sendError(res, 'hora es requerida', 400);
    if (!motivo || motivo.trim() === '') return sendError(res, 'motivo es requerido', 400);
    if (!estado || estado.trim() === '') return sendError(res, 'estado es requerido', 400);

    const { data, error } = await supabase
      .from('citas')
      .insert([{ 
        estudiante_id, 
        usuario_id, 
        fecha, 
        hora, 
        motivo: motivo.trim(), 
        estado: estado.trim() 
      }])
      .select('*')
      .single();

    if (error) throw error;

    console.log(`✅ Cita creada: ${data.id}`);
    return sendSuccess(res, data, 'Cita creada correctamente', 201);
  } catch (err) {
    console.error('❌ Error POST /citas:', err);
    return sendError(res, err.message || 'Error al crear cita', 500);
  }
};

const updateCita = async (req, res) => {
  try {
    const { id } = req.params;
    const { fecha, hora, motivo, estado } = req.body;
    console.log(`📌 PUT /citas/${id}`);

    const payload = {};
    if (fecha) payload.fecha = fecha;
    if (hora) payload.hora = hora;
    if (motivo && motivo.trim()) payload.motivo = motivo.trim();
    if (estado && estado.trim()) payload.estado = estado.trim();

    if (Object.keys(payload).length === 0) {
      return sendError(res, 'Se debe enviar al menos un campo para actualizar', 400);
    }

    const { data, error } = await supabase
      .from('citas')
      .update(payload)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    console.log(`✅ Cita ${id} actualizada`);
    return sendSuccess(res, data, 'Cita actualizada correctamente');
  } catch (err) {
    console.error('❌ Error PUT /citas/:id:', err);
    return sendError(res, err.message || 'Error al actualizar cita', 500);
  }
};

const deleteCita = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📌 DELETE /citas/${id}`);

    const { error } = await supabase
      .from('citas')
      .delete()
      .eq('id', id);

    if (error) throw error;

    console.log(`✅ Cita ${id} eliminada`);
    return sendSuccess(res, { id }, 'Cita eliminada correctamente');
  } catch (err) {
    console.error('❌ Error DELETE /citas/:id:', err);
    return sendError(res, err.message || 'Error al eliminar cita', 500);
  }
};

module.exports = { getCitas, createCita, updateCita, deleteCita };
