const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { uploadBufferToStorage } = require('../utils/storage');
const { logDonationNotification, logTransparansiTimeline } = require('../utils/firestore');

const createOne = asyncHandler(async (req, res) => {
  const idDonatur = req.user.idDonatur;
  const { id_kebutuhan, nominal, metode_bayar } = req.body;

  if (!idDonatur) {
    return res.status(403).json({ message: 'Hanya donatur yang bisa membuat donasi.' });
  }

  if (!id_kebutuhan || !nominal) {
    return res.status(400).json({ message: 'Kebutuhan dan nominal wajib diisi.' });
  }

  let buktiTransferUrl = null;
  if (req.file) {
    const uploaded = await uploadBufferToStorage(req.file, 'bukti-transfer');
    buktiTransferUrl = uploaded?.url || null;
  }

  const result = await pool.query(
    `INSERT INTO donasi (id_donatur, id_kebutuhan, nominal, metode_bayar, bukti_transfer_url, status)
     VALUES ($1, $2, $3, $4, $5, 'pending')
     RETURNING *`,
    [idDonatur, id_kebutuhan, nominal, metode_bayar || null, buktiTransferUrl]
  );

  return sendSuccess(res, 'Donasi berhasil dibuat dan menunggu verifikasi.', result.rows[0], 201);
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
     WHERE dn.status IN ('terverifikasi', 'diterima')
     ORDER BY dn.created_at DESC`
  );

  return sendSuccess(res, 'Daftar donasi terverifikasi berhasil dimuat.', result.rows);
});

const verifyOne = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowedStatus = ['terverifikasi', 'diterima'];

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
    judul: 'Donasi terverifikasi',
    pesan: `Donasi untuk ${kebutuhanInfo.rows[0]?.nama_barang || 'kebutuhan'} telah berstatus ${status}.`,
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

module.exports = {
  createOne,
  listPending,
  listVerified,
  verifyOne
};
