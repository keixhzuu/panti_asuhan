const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { listCollection } = require('../utils/firestore');
const { getSignedUrlForStoredUrl } = require('../utils/storage');

const getKatalogRealtime = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT
       k.*,
       p.nama_panti,
       COALESCE(verified_agg.total_verified, 0) AS total_donasi_terkumpul,
       GREATEST(k.jumlah_dibutuhkan - COALESCE(pending_agg.total_pending, 0), 0) AS sisa_donasi
     FROM kebutuhan_logistik k
     JOIN panti p ON p.id = k.id_panti
     LEFT JOIN LATERAL (
       SELECT COALESCE(SUM(dn.jumlah_donasi), 0) AS total_pending
       FROM donasi dn
       WHERE dn.id_kebutuhan = k.id
         AND dn.status = 'pending'
     ) pending_agg ON TRUE
     LEFT JOIN LATERAL (
       SELECT COALESCE(SUM(dn.jumlah_donasi), 0) AS total_verified
       FROM donasi dn
       WHERE dn.id_kebutuhan = k.id
         AND dn.status = 'verifikasi'
     ) verified_agg ON TRUE
     WHERE k.status = 'aktif'
     ORDER BY k.created_at DESC`
  );

  return sendSuccess(res, 'Katalog kebutuhan berhasil dimuat.', result.rows);
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
  const [totalMasuk, totalKeluar, penyaluran, timeline] = await Promise.all([
    pool.query(`SELECT COALESCE(SUM(nominal), 0) AS total FROM donasi WHERE status = 'verifikasi'`),
    pool.query(`SELECT COALESCE(SUM(jumlah_disalurkan), 0) AS total FROM penyaluran_dana WHERE status_penyaluran = 'berhasil'`),
    pool.query(
      `SELECT pd.id, pd.bukti_url AS url, pd.deskripsi_penggunaan AS deskripsi, pd.tanggal_salur, pd.created_at, p.nama_panti, d.nama AS nama_donatur
       FROM penyaluran_dana pd
       JOIN panti p ON p.id = pd.id_panti
       JOIN donasi dn ON dn.id = pd.id_donasi
       JOIN donatur d ON d.id = dn.id_donatur
       WHERE pd.bukti_url IS NOT NULL
       ORDER BY pd.created_at DESC`
    ),
    listCollection('transparansi_timeline')
  ]);

  const timelineWithUrls = await Promise.all(
    timeline.map(async (item) => ({
      ...item,
      bukti_url: await getSignedUrlForStoredUrl(item.bukti_url)
    }))
  );

  const galeriWithUrls = await Promise.all(
    penyaluran.rows.map(async (item) => ({
      ...item,
      url: await getSignedUrlForStoredUrl(item.url)
    }))
  );

  return sendSuccess(res, 'Data tracking dana berhasil dimuat.', {
    summary: {
      total_dana_masuk: Number(totalMasuk.rows[0].total),
      total_dana_keluar: Number(totalKeluar.rows[0].total),
      saldo_akhir: Number(totalMasuk.rows[0].total) - Number(totalKeluar.rows[0].total)
    },
    timeline: timelineWithUrls,
    galeri: galeriWithUrls
  });
});

const getGaleri = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT pd.id, pd.bukti_url AS url, pd.deskripsi_penggunaan AS deskripsi, pd.tanggal_salur, pd.created_at, p.nama_panti, d.nama AS nama_donatur
     FROM penyaluran_dana pd
     JOIN panti p ON p.id = pd.id_panti
     JOIN donasi dn ON dn.id = pd.id_donasi
     JOIN donatur d ON d.id = dn.id_donatur
     WHERE pd.bukti_url IS NOT NULL
     ORDER BY pd.created_at DESC`
  );

  const itemsWithUrls = await Promise.all(
    result.rows.map(async (item) => ({
      ...item,
      url: await getSignedUrlForStoredUrl(item.url)
    }))
  );
  return sendSuccess(res, 'Galeri bukti berhasil dimuat.', itemsWithUrls);
});

const getNotifikasi = asyncHandler(async (req, res) => {
  const idDonatur = req.user.idDonatur;
  const result = await pool.query(
    `SELECT
      dn.id,
      dn.status,
      dn.nominal,
      dn.metode_bayar,
      dn.created_at,
      dn.alasan_ditolak,
      k.nama_barang,
      p.nama_panti,
      CASE
        WHEN dn.status = 'verifikasi' THEN 'Donasi diverifikasi'
        WHEN dn.status = 'ditolak' THEN 'Donasi ditolak'
        WHEN dn.status = 'refund_diajukan' THEN 'Anda berhasil ajukan refund'
        WHEN dn.status = 'refund_disetujui' THEN 'Refund disetujui'
        ELSE 'Donasi menunggu verifikasi'
      END AS judul,
      CASE
        WHEN dn.status = 'verifikasi' THEN CONCAT('Donasi untuk ', k.nama_barang, ' telah diverifikasi.')
        WHEN dn.status = 'ditolak' THEN CONCAT('Donasi untuk ', k.nama_barang, ' ditolak.', CASE WHEN dn.alasan_ditolak IS NOT NULL THEN CONCAT(' Alasan: ', dn.alasan_ditolak) ELSE '' END)
        WHEN dn.status = 'refund_diajukan' THEN CONCAT('Pengajuan refund untuk ', k.nama_barang, ' berhasil dikirim dan sedang diproses.')
        WHEN dn.status = 'refund_disetujui' THEN CONCAT('Pengajuan refund untuk ', k.nama_barang, ' telah disetujui.')
        ELSE CONCAT('Donasi untuk ', k.nama_barang, ' masih menunggu verifikasi.')
      END AS pesan
     FROM donasi dn
     JOIN kebutuhan_logistik k ON k.id = dn.id_kebutuhan
     JOIN panti p ON p.id = k.id_panti
     WHERE dn.id_donatur = $1
     ORDER BY dn.created_at DESC`,
    [idDonatur]
  );

  return sendSuccess(res, 'Notifikasi berhasil dimuat.', result.rows);
});

module.exports = {
  getKatalogRealtime,
  getRiwayatDonasi,
  getTrackingDana,
  getGaleri,
  getNotifikasi
};
