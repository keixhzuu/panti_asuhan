const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');

const dashboard = asyncHandler(async (req, res) => {
  const [donasiMasuk, kebutuhanAktif, donaturBaru, kebutuhanTerpenuhi, totalPenyaluran, trendResult] = await Promise.all([
    pool.query(`SELECT COALESCE(SUM(nominal), 0) AS total FROM donasi WHERE status = 'verifikasi'`),
    pool.query(`SELECT COUNT(*) AS total FROM kebutuhan_logistik WHERE status = 'aktif'`),
    pool.query(`SELECT COUNT(*) AS total FROM donatur`),
    pool.query(`SELECT COUNT(*) AS total FROM kebutuhan_logistik WHERE jumlah_dibutuhkan = 0`),
    pool.query(`SELECT COALESCE(SUM(jumlah_disalurkan), 0) AS total FROM penyaluran_dana WHERE status_penyaluran = 'berhasil'`),
    pool.query(`
      WITH daily_masuk AS (
          SELECT 
              DATE(created_at) AS tanggal,
              SUM(nominal) AS total_masuk
          FROM donasi
          WHERE status = 'verifikasi'
          GROUP BY DATE(created_at)
      ),
      daily_keluar AS (
          SELECT 
              tanggal_salur AS tanggal,
              SUM(jumlah_disalurkan) AS total_keluar
          FROM penyaluran_dana
          WHERE status_penyaluran = 'berhasil'
          GROUP BY tanggal_salur
      )
      SELECT 
          d.tanggal::text,
          COALESCE(m.total_masuk, 0)::float AS total_masuk,
          COALESCE(k.total_keluar, 0)::float AS total_keluar
      FROM (
          SELECT generate_series(CURRENT_DATE - INTERVAL '29 days', CURRENT_DATE, '1 day')::date AS tanggal
      ) d
      LEFT JOIN daily_masuk m ON m.tanggal = d.tanggal
      LEFT JOIN daily_keluar k ON k.tanggal = d.tanggal
      ORDER BY d.tanggal ASC
    `)
  ]);

  return sendSuccess(res, 'Dashboard admin berhasil dimuat.', {
    total_donasi_masuk: Number(donasiMasuk.rows[0].total),
    jumlah_kebutuhan_aktif: Number(kebutuhanAktif.rows[0].total),
    total_donatur: Number(donaturBaru.rows[0].total),
    kebutuhan_terpenuhi: Number(kebutuhanTerpenuhi.rows[0].total),
    total_penyaluran: Number(totalPenyaluran.rows[0].total),
    trend_data: trendResult.rows
  });
});

module.exports = {
  dashboard
};
