const express = require('express');
const laporanController = require('../controllers/laporanController');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/download-pdf', protect, requireRole('pengurus'), laporanController.downloadPdf);
router.get('/download-excel', protect, requireRole('pengurus'), laporanController.downloadExcel);
router.get('/trend', protect, laporanController.getTrendData);
router.get('/kategori', protect, laporanController.getKategoriData);

module.exports = router;
