const express = require('express');
const donaturController = require('../controllers/donaturController');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/katalog', donaturController.getKatalogRealtime);
router.get('/riwayat', protect, requireRole('donatur'), donaturController.getRiwayatDonasi);
router.get('/tracking', protect, requireRole('donatur'), donaturController.getTrackingDana);
router.get('/galeri', donaturController.getGaleri);
router.get('/notifikasi', protect, requireRole('donatur'), donaturController.getNotifikasi);

module.exports = router;
