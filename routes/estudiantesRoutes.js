const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const {
  getEstudiantes,
  getEstudianteById,
  createEstudiante,
  updateEstudiante,
  deleteEstudiante
} = require('../controllers/estudiantesController');

router.use(authenticateToken);

router.get('/', getEstudiantes);
router.get('/:id', getEstudianteById);
// Only admin and consejero can create, update, delete estudiantes
router.post('/', authorizeRoles(['admin', 'consejero']), createEstudiante);
router.put('/:id', updateEstudiante);
router.put('/:id', authorizeRoles(['admin', 'consejero']), updateEstudiante);
router.delete('/:id', deleteEstudiante);
router.delete('/:id', authorizeRoles(['admin', 'consejero']), deleteEstudiante);

module.exports = router;
