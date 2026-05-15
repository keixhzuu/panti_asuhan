const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { syncKebutuhanRealtime } = require('../utils/firestore');

const getAll = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT k.*, p.nama_panti
     FROM kebutuhan_logistik k
     JOIN panti p ON p.id = k.id_panti
     ORDER BY k.created_at DESC`
  );
  return sendSuccess(res, 'Data kebutuhan berhasil dimuat.', result.rows);
});

const getById = asyncHandler(async (req, res) => {
  const result = await pool.query('SELECT * FROM kebutuhan_logistik WHERE id = $1', [req.params.id]);
  if (result.rowCount === 0) {
    return res.status(404).json({ message: 'Kebutuhan tidak ditemukan.' });
  }
  return sendSuccess(res, 'Detail kebutuhan berhasil dimuat.', result.rows[0]);
});

const createOne = asyncHandler(async (req, res) => {
  const { id_panti, nama_barang, jumlah_dibutuhkan, satuan, tingkat_urgensi, status } = req.body;
  if (!id_panti || !nama_barang || !jumlah_dibutuhkan) {
    return res.status(400).json({ message: 'Panti, nama barang, dan jumlah dibutuhkan wajib diisi.' });
  }

  const result = await pool.query(
    `INSERT INTO kebutuhan_logistik (id_panti, nama_barang, jumlah_dibutuhkan, satuan, tingkat_urgensi, status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [id_panti, nama_barang, jumlah_dibutuhkan, satuan || null, tingkat_urgensi || 'Biasa', status || 'aktif']
  );

  await syncKebutuhanRealtime({
    ...result.rows[0],
    deleted: false
  });

  return sendSuccess(res, 'Kebutuhan berhasil ditambahkan.', result.rows[0], 201);
});

const updateOne = asyncHandler(async (req, res) => {
  const { id_panti, nama_barang, jumlah_dibutuhkan, satuan, tingkat_urgensi, status } = req.body;
  const result = await pool.query(
    `UPDATE kebutuhan_logistik
     SET id_panti = COALESCE($1, id_panti),
         nama_barang = COALESCE($2, nama_barang),
         jumlah_dibutuhkan = COALESCE($3, jumlah_dibutuhkan),
         satuan = COALESCE($4, satuan),
         tingkat_urgensi = COALESCE($5, tingkat_urgensi),
         status = COALESCE($6, status)
     WHERE id = $7
     RETURNING *`,
    [id_panti || null, nama_barang || null, jumlah_dibutuhkan || null, satuan || null, tingkat_urgensi || null, status || null, req.params.id]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ message: 'Kebutuhan tidak ditemukan.' });
  }

  await syncKebutuhanRealtime({
    ...result.rows[0],
    deleted: false
  });

  return sendSuccess(res, 'Kebutuhan berhasil diperbarui.', result.rows[0]);
});

const removeOne = asyncHandler(async (req, res) => {
  const result = await pool.query('DELETE FROM kebutuhan_logistik WHERE id = $1 RETURNING *', [req.params.id]);
  if (result.rowCount === 0) {
    return res.status(404).json({ message: 'Kebutuhan tidak ditemukan.' });
  }

  await syncKebutuhanRealtime({
    ...result.rows[0],
    deleted: true,
    status: 'selesai'
  });

  return sendSuccess(res, 'Kebutuhan berhasil dihapus.', result.rows[0]);
});

module.exports = {
  getAll,
  getById,
  createOne,
  updateOne,
  removeOne
};
