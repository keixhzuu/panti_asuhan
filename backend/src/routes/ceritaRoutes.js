const express = require('express');
const ceritaController = require('../controllers/ceritaController');
const upload = require('../middleware/upload');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', ceritaController.getAll);
router.get('/:id', ceritaController.getById);
router.post('/', protect, requireRole('pengurus'), upload.single('foto'), ceritaController.createOne);
router.put('/:id', protect, requireRole('pengurus'), upload.single('foto'), ceritaController.updateOne);
router.delete('/:id', protect, requireRole('pengurus'), ceritaController.removeOne);

module.exports = router;
