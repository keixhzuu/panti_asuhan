const express = require('express');
const penyaluranController = require('../controllers/penyaluranController');
const upload = require('../middleware/upload');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/ready-categories', protect, requireRole('pengurus'), penyaluranController.getReadyCategories);
router.post('/', protect, requireRole('pengurus'), upload.single('foto_bukti'), penyaluranController.createOne);
router.post('/bukti', protect, requireRole('pengurus'), upload.single('foto_bukti'), penyaluranController.attachBukti);

module.exports = router;
