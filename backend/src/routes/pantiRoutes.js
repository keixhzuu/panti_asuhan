const express = require('express');
const pantiController = require('../controllers/pantiController');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, requireRole('pengurus'), pantiController.getAll);
router.get('/:id', protect, requireRole('pengurus'), pantiController.getById);
router.post('/', protect, requireRole('pengurus'), pantiController.createOne);
router.put('/:id', protect, requireRole('pengurus'), pantiController.updateOne);
router.delete('/:id', protect, requireRole('pengurus'), pantiController.removeOne);

module.exports = router;
