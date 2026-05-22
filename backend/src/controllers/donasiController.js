const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { uploadBufferToStorage } = require('../utils/storage');
const { logDonationNotification, logTransparansiTimeline } = require('../utils/firestore');

const createOne = asyncHandler(async (req, res) => {
  const idDonatur = req.user.idDonatur;
  const { id_kebutuhan, jumlah_donasi, metode_bayar } = req.body;

  if (!idDonatur) {
    return res.status(403).json({ message: 'Hanya donatur yang bisa membuat donasi.' });
  }

  const jumlahDonasi = Number(jumlah_donasi);
  if (!id_kebutuhan || !jumlahDonasi || Number.isNaN(jumlahDonasi) || jumlahDonasi <= 0) {
    return res.status(400).json({ message: 'Kebutuhan dan jumlah donasi wajib diisi.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const kebutuhanResult = await client.query(
      `SELECT id, nama_barang, harga_satuan, jumlah_dibutuhkan
       FROM kebutuhan_logistik
       WHERE id = $1
       FOR UPDATE`,
      [id_kebutuhan]
    );

    if (kebutuhanResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Kebutuhan tidak ditemukan.' });
    }

    const kebutuhan = kebutuhanResult.rows[0];
    const totalTerkumpulResult = await client.query(
      `SELECT COALESCE(SUM(jumlah_donasi), 0) AS total_terkumpul
       FROM donasi
       WHERE id_kebutuhan = $1
         AND status IN ('pending', 'verifikasi')`,
      [id_kebutuhan]
    );

    const totalTerkumpul = Number(totalTerkumpulResult.rows[0]?.total_terkumpul || 0);
    const sisa = Number(kebutuhan.jumlah_dibutuhkan) - totalTerkumpul;

    if (jumlahDonasi > sisa) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        message: sisa <= 0
          ? 'Kebutuhan sudah terpenuhi.'
          : `Jumlah pcs melebihi sisa kebutuhan. Sisa tersedia ${sisa} pcs.`,
        sisa_donasi: Math.max(sisa, 0)
      });
    }

    const nominal = Number(kebutuhan.harga_satuan) * jumlahDonasi;

    let buktiTransferUrl = null;
    if (req.file) {
      const uploaded = await uploadBufferToStorage(req.file, 'bukti-transfer');
      buktiTransferUrl = uploaded?.url || null;
    }

    const result = await client.query(
      `INSERT INTO donasi (id_donatur, id_kebutuhan, jumlah_donasi, nominal, metode_bayar, bukti_transfer_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING *`,
      [idDonatur, id_kebutuhan, jumlahDonasi, nominal, metode_bayar || null, buktiTransferUrl]
    );

    await client.query('COMMIT');

    return sendSuccess(res, 'Donasi berhasil dibuat dan menunggu verifikasi.', result.rows[0], 201);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
});

const listPending = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT dn.*, d.nama AS nama_donatur, k.nama_barang
     FROM donasi dn
     JOIN donatur d ON d.id = dn.id_donatur
     JOIN kebutuhan_logistik k ON k.id = dn.id_kebutuhan
     WHERE dn.status = 'pending'
     ORDER BY dn.created_at DESC`
  );

  return sendSuccess(res, 'Daftar donasi pending berhasil dimuat.', result.rows);
});

const listVerified = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT dn.*, d.nama AS nama_donatur, k.nama_barang
     FROM donasi dn
     JOIN donatur d ON d.id = dn.id_donatur
     JOIN kebutuhan_logistik k ON k.id = dn.id_kebutuhan
     WHERE dn.status = 'verifikasi'
     ORDER BY dn.created_at DESC`
  );

  return sendSuccess(res, 'Daftar donasi verifikasi berhasil dimuat.', result.rows);
});

const verifyOne = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowedStatus = ['verifikasi', 'ditolak'];

  if (!allowedStatus.includes(status)) {
    return res.status(400).json({ message: 'Status verifikasi tidak valid.' });
  }

  const result = await pool.query(
    `UPDATE donasi
     SET status = $1
     WHERE id = $2
     RETURNING *`,
    [status, req.params.id]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ message: 'Donasi tidak ditemukan.' });
  }

  const donation = result.rows[0];
  const donorInfo = await pool.query('SELECT email, nama FROM donatur WHERE id = $1', [donation.id_donatur]);
  const kebutuhanInfo = await pool.query('SELECT nama_barang FROM kebutuhan_logistik WHERE id = $1', [donation.id_kebutuhan]);

  await logDonationNotification({
    id_donatur: donation.id_donatur,
    id_donasi: donation.id,
    judul: status === 'verifikasi' ? 'Donasi diverifikasi' : 'Donasi ditolak',
    pesan: status === 'verifikasi'
      ? `Donasi untuk ${kebutuhanInfo.rows[0]?.nama_barang || 'kebutuhan'} telah diverifikasi.`
      : `Donasi untuk ${kebutuhanInfo.rows[0]?.nama_barang || 'kebutuhan'} ditolak.`,
    status,
    email_donatur: donorInfo.rows[0]?.email || null
  });

  await logTransparansiTimeline({
    id_donasi: donation.id,
    tipe: 'verifikasi_donasi',
    status,
    nominal: Number(donation.nominal),
    id_donatur: donation.id_donatur,
    id_kebutuhan: donation.id_kebutuhan,
    judul: 'Verifikasi donasi'
  });

  return sendSuccess(res, 'Status donasi berhasil diperbarui.', donation);
});

const getOne = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const result = await pool.query(
    `SELECT dn.*, d.nama AS nama_donatur, k.nama_barang
     FROM donasi dn
     JOIN donatur d ON d.id = dn.id_donatur
     JOIN kebutuhan_logistik k ON k.id = dn.id_kebutuhan
     WHERE dn.id = $1
     LIMIT 1`,
    [id]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ message: 'Donasi tidak ditemukan.' });
  }

  const donation = result.rows[0];

  // Ensure any stored URLs are signed if using private GCS
  const { getSignedUrlForStoredUrl } = require('../utils/storage');
  if (donation.bukti_transfer_url) {
    try {
      donation.bukti_transfer_signed = await getSignedUrlForStoredUrl(donation.bukti_transfer_url);
    } catch (err) {
      donation.bukti_transfer_signed = donation.bukti_transfer_url;
    }
  }

  // Also fetch any penyaluran entries (bukti_url) related to this donation
  const penyaluranRes = await pool.query(
    `SELECT id, id_panti, jumlah_disalurkan, tanggal_salur, deskripsi_penggunaan, bukti_url
     FROM penyaluran_dana
     WHERE id_donasi = $1
     ORDER BY tanggal_salur DESC`,
    [donation.id]
  );

  if (penyaluranRes.rowCount > 0) {
    donation.penyaluran = await Promise.all(penyaluranRes.rows.map(async (p) => {
      const out = { ...p };
      if (p.bukti_url) {
        try {
          out.bukti_signed = await getSignedUrlForStoredUrl(p.bukti_url);
        } catch (err) {
          out.bukti_signed = p.bukti_url;
        }
      }
      return out;
    }));
  } else {
    donation.penyaluran = [];
  }

  return sendSuccess(res, 'Detail donasi berhasil dimuat.', donation);
});

module.exports = {
  createOne,
  listPending,
  listVerified,
  verifyOne,
  getOne
};
