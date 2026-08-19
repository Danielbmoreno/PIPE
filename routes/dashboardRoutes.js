const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getDashboardMetrics } = require('../controllers/dashboardController');

router.use(authenticateToken);
router.get('/', getDashboardMetrics);

module.exports = router;