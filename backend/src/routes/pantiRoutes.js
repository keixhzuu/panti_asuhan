const express = require('express');
const pantiController = require('../controllers/pantiController');
const { protect, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', protect, requireRole('pengurus', 'donatur'), pantiController.getAll);
router.get('/:id', protect, requireRole('pengurus', 'donatur'), pantiController.getById);
router.post('/', protect, requireRole('pengurus'), upload.single('foto_panti'), pantiController.createOne);
router.put('/:id', protect, requireRole('pengurus'), upload.single('foto_panti'), pantiController.updateOne);
router.delete('/:id', protect, requireRole('pengurus'), pantiController.removeOne);

module.exports = router;
