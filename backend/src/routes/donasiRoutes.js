const express = require('express');
const donasiController = require('../controllers/donasiController');
const upload = require('../middleware/upload');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, requireRole('donatur'), upload.single('bukti_transfer'), donasiController.createOne);
router.get('/pending', protect, requireRole('pengurus'), donasiController.listPending);
router.get('/:id', protect, requireRole('pengurus'), donasiController.getOne);
router.get('/verified', protect, requireRole('pengurus'), donasiController.listVerified);
router.put('/:id/verify', protect, requireRole('pengurus'), donasiController.verifyOne);

module.exports = router;
