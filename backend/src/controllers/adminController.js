const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');

const dashboard = asyncHandler(async (req, res) => {
  const [donasiMasuk, kebutuhanAktif, donaturBaru, stokHampirHabis, totalPenyaluran] = await Promise.all([
    pool.query(`SELECT COALESCE(SUM(nominal), 0) AS total FROM donasi WHERE status = 'verifikasi'`),
    pool.query(`SELECT COUNT(*) AS total FROM kebutuhan_logistik WHERE status = 'aktif'`),
    pool.query(`SELECT COUNT(*) AS total FROM donatur WHERE created_at >= NOW() - INTERVAL '30 days'`),
    pool.query(`SELECT COUNT(*) AS total FROM kebutuhan_logistik WHERE status = 'aktif' AND jumlah_dibutuhkan <= 5`),
    pool.query(`SELECT COALESCE(SUM(jumlah_disalurkan), 0) AS total FROM penyaluran_dana WHERE status_penyaluran = 'berhasil'`)
  ]);

  return sendSuccess(res, 'Dashboard admin berhasil dimuat.', {
    total_donasi_masuk: Number(donasiMasuk.rows[0].total),
    jumlah_kebutuhan_aktif: Number(kebutuhanAktif.rows[0].total),
    donatur_baru: Number(donaturBaru.rows[0].total),
    stok_hampir_habis: Number(stokHampirHabis.rows[0].total),
    total_penyaluran: Number(totalPenyaluran.rows[0].total)
  });
});

module.exports = {
  dashboard
};
