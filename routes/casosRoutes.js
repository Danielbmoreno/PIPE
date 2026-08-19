const express = require('express');
const router = express.Router();
const {
  getCasos,
  createCaso,
  updateCaso,
  deleteCaso
} = require('../controllers/casosController');

router.get('/', getCasos);
router.post('/', createCaso);
router.put('/:id', updateCaso);
router.delete('/:id', deleteCaso);

module.exports = router;
