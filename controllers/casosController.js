const db = require('../config/db');
const { sendSuccess, sendError } = require('./responseHelper');

const getCasos = (req, res) => {
  try {
    console.log('📌 GET /casos');
    const data = db.getAll('casos').sort((a, b) => b.id - a.id);

    console.log(`✅ ${data.length} casos obtenidos`);
    return sendSuccess(res, data, 'Casos obtenidos correctamente');
  } catch (err) {
    console.error('❌ Error GET /casos:', err);
    return sendError(res, err.message || 'Error al obtener casos', 500);
  }
};

const createCaso = (req, res) => {
  try {
    const { estudiante_id, usuario_id, descripcion, estado } = req.body;
    console.log('📌 POST /casos', { estudiante_id, estado });

    if (!estudiante_id) return sendError(res, 'estudiante_id es requerido', 400);
    if (!usuario_id) return sendError(res, 'usuario_id es requerido', 400);
    if (!descripcion || descripcion.trim() === '') return sendError(res, 'descripcion es requerida', 400);
    if (!estado || estado.trim() === '') return sendError(res, 'estado es requerido', 400);

    const data = db.insert('casos', {
      estudiante_id,
      usuario_id,
      descripcion: descripcion.trim(),
      estado: estado.trim()
    });

    console.log(`✅ Caso creado: ${data.id}`);
    return sendSuccess(res, data, 'Caso creado correctamente', 201);
  } catch (err) {
    console.error('❌ Error POST /casos:', err);
    return sendError(res, err.message || 'Error al crear caso', 500);
  }
};

const updateCaso = (req, res) => {
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

    const data = db.update('casos', id, payload);
    if (!data) {
      return sendError(res, 'Caso no encontrado', 404);
    }

    console.log(`✅ Caso ${id} actualizado`);
    return sendSuccess(res, data, 'Caso actualizado correctamente');
  } catch (err) {
    console.error('❌ Error PUT /casos/:id:', err);
    return sendError(res, err.message || 'Error al actualizar caso', 500);
  }
};

const deleteCaso = (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📌 DELETE /casos/${id}`);

    const deleted = db.remove('casos', id);
    if (!deleted) {
      return sendError(res, 'Caso no encontrado', 404);
    }

    console.log(`✅ Caso ${id} eliminado`);
    return sendSuccess(res, { id: Number(id) }, 'Caso eliminado correctamente');
  } catch (err) {
    console.error('❌ Error DELETE /casos/:id:', err);
    return sendError(res, err.message || 'Error al eliminar caso', 500);
  }
};

module.exports = { getCasos, createCaso, updateCaso, deleteCaso };
