const express = require('express');
const router = express.Router();
const {
  getIntervenciones,
  createIntervencion,
  updateIntervencion,
  deleteIntervencion
} = require('../controllers/intervencionesController');

router.get('/', getIntervenciones);
router.post('/', createIntervencion);
router.put('/:id', updateIntervencion);
router.delete('/:id', deleteIntervencion);

module.exports = router;
