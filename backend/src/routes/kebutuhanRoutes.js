const express = require('express');
const kebutuhanController = require('../controllers/kebutuhanController');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, requireRole('pengurus'), kebutuhanController.getAll);
router.get('/:id', protect, requireRole('pengurus'), kebutuhanController.getById);
router.post('/', protect, requireRole('pengurus'), kebutuhanController.createOne);
router.put('/:id', protect, requireRole('pengurus'), kebutuhanController.updateOne);
router.delete('/:id', protect, requireRole('pengurus'), kebutuhanController.removeOne);

module.exports = router;
