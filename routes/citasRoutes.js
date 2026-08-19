const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getCitas,
  createCita,
  updateCita,
  deleteCita
} = require('../controllers/citasController');

router.use(authenticateToken);

router.get('/', getCitas);
router.post('/', createCita);
router.put('/:id', updateCita);
router.delete('/:id', deleteCita);

module.exports = router;
