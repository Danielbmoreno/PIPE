const express = require('express');
const router = express.Router();
const {
  getAlertas,
  createAlerta,
  updateAlerta,
  deleteAlerta
} = require('../controllers/alertasController');

router.get('/', getAlertas);
router.post('/', createAlerta);
router.put('/:id', updateAlerta);
router.delete('/:id', deleteAlerta);

module.exports = router;
