const db = require('../config/db');
const { sendSuccess, sendError } = require('./responseHelper');

const getAlertas = (req, res) => {
  try {
    console.log('📌 GET /alertas');
    const data = db.getAll('alertas').sort((a, b) => b.id - a.id);

    console.log(`✅ ${data.length} alertas obtenidas`);
    return sendSuccess(res, data, 'Alertas obtenidas correctamente');
  } catch (err) {
    console.error('❌ Error GET /alertas:', err);
    return sendError(res, err.message || 'Error al obtener alertas', 500);
  }
};

const createAlerta = (req, res) => {
  try {
    const { estudiante_id, usuario_id, descripcion, nivel_riesgo } = req.body;
    console.log('📌 POST /alertas', { estudiante_id, nivel_riesgo });

    if (!estudiante_id) return sendError(res, 'estudiante_id es requerido', 400);
    if (!usuario_id) return sendError(res, 'usuario_id es requerido', 400);
    if (!descripcion || descripcion.trim() === '') return sendError(res, 'descripcion es requerida', 400);
    if (!nivel_riesgo || nivel_riesgo.trim() === '') return sendError(res, 'nivel_riesgo es requerido', 400);

    const data = db.insert('alertas', {
      estudiante_id,
      usuario_id,
      descripcion: descripcion.trim(),
      nivel_riesgo: nivel_riesgo.trim()
    });

    console.log(`✅ Alerta creada: ${data.id}`);
    return sendSuccess(res, data, 'Alerta creada correctamente', 201);
  } catch (err) {
    console.error('❌ Error POST /alertas:', err);
    return sendError(res, err.message || 'Error al crear alerta', 500);
  }
};

const updateAlerta = (req, res) => {
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

    const data = db.update('alertas', id, payload);
    if (!data) {
      return sendError(res, 'Alerta no encontrada', 404);
    }

    console.log(`✅ Alerta ${id} actualizada`);
    return sendSuccess(res, data, 'Alerta actualizada correctamente');
  } catch (err) {
    console.error('❌ Error PUT /alertas/:id:', err);
    return sendError(res, err.message || 'Error al actualizar alerta', 500);
  }
};

const deleteAlerta = (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📌 DELETE /alertas/${id}`);

    const deleted = db.remove('alertas', id);
    if (!deleted) {
      return sendError(res, 'Alerta no encontrada', 404);
    }

    console.log(`✅ Alerta ${id} eliminada`);
    return sendSuccess(res, { id: Number(id) }, 'Alerta eliminada correctamente');
  } catch (err) {
    console.error('❌ Error DELETE /alertas/:id:', err);
    return sendError(res, err.message || 'Error al eliminar alerta', 500);
  }
};

module.exports = { getAlertas, createAlerta, updateAlerta, deleteAlerta };
