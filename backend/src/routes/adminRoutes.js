const express = require('express');
const adminController = require('../controllers/adminController');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', protect, requireRole('pengurus'), adminController.dashboard);
router.put('/notifikasi/:id/read', protect, requireRole('pengurus'), adminController.markNotificationRead);

module.exports = router;
