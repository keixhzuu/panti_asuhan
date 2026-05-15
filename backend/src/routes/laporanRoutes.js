const express = require('express');
const laporanController = require('../controllers/laporanController');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, requireRole('pengurus'), laporanController.getAll);
router.post('/generate', protect, requireRole('pengurus'), laporanController.generateOne);

module.exports = router;
