const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { listCollection, listNotificationsByDonatur } = require('../utils/firestore');

const getKatalogRealtime = asyncHandler(async (req, res) => {
  const items = await listCollection('update_kebutuhan_realtime');
  const filtered = items.filter((item) => !item.deleted && item.status !== 'selesai');
  return sendSuccess(res, 'Katalog kebutuhan realtime berhasil dimuat.', filtered);
});

const getRiwayatDonasi = asyncHandler(async (req, res) => {
  const idDonatur = req.user.idDonatur;
  const result = await pool.query(
    `SELECT dn.*, k.nama_barang, k.satuan, p.nama_panti
     FROM donasi dn
     JOIN kebutuhan_logistik k ON k.id = dn.id_kebutuhan
     JOIN panti p ON p.id = k.id_panti
     WHERE dn.id_donatur = $1
     ORDER BY dn.created_at DESC`,
    [idDonatur]
  );

  return sendSuccess(res, 'Riwayat donasi berhasil dimuat.', result.rows);
});

const getTrackingDana = asyncHandler(async (req, res) => {
  const [totalMasuk, totalKeluar, timeline, galeri] = await Promise.all([
    pool.query(`SELECT COALESCE(SUM(nominal), 0) AS total FROM donasi WHERE status IN ('terverifikasi', 'diterima')`),
    pool.query(`SELECT COALESCE(SUM(jumlah_disalurkan), 0) AS total FROM penyaluran_dana WHERE status_penyaluran = 'berhasil'`),
    listCollection('transparansi_timeline'),
    listCollection('bukti_foto')
  ]);

  return sendSuccess(res, 'Data tracking dana berhasil dimuat.', {
    summary: {
      total_dana_masuk: Number(totalMasuk.rows[0].total),
      total_dana_keluar: Number(totalKeluar.rows[0].total),
      saldo_akhir: Number(totalMasuk.rows[0].total) - Number(totalKeluar.rows[0].total)
    },
    timeline,
    galeri
  });
});

const getGaleri = asyncHandler(async (req, res) => {
  const items = await listCollection('bukti_foto');
  return sendSuccess(res, 'Galeri bukti berhasil dimuat.', items);
});

const getNotifikasi = asyncHandler(async (req, res) => {
  const idDonatur = req.user.idDonatur;
  const items = await listNotificationsByDonatur(idDonatur);
  return sendSuccess(res, 'Notifikasi berhasil dimuat.', items);
});

module.exports = {
  getKatalogRealtime,
  getRiwayatDonasi,
  getTrackingDana,
  getGaleri,
  getNotifikasi
};
