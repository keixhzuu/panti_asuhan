const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { uploadBufferToStorage } = require('../utils/storage');
const { logCeritaAktivitas } = require('../utils/firestore');

const getAll = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT c.*, p.nama_panti
     FROM cerita_aktivitas c
     JOIN panti p ON p.id = c.id_panti
     ORDER BY c.created_at DESC`
  );

  return sendSuccess(res, 'Daftar cerita berhasil dimuat.', result.rows);
});

const getById = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT c.*, p.nama_panti
     FROM cerita_aktivitas c
     JOIN panti p ON p.id = c.id_panti
     WHERE c.id = $1`,
    [req.params.id]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ message: 'Cerita tidak ditemukan.' });
  }

  return sendSuccess(res, 'Detail cerita berhasil dimuat.', result.rows[0]);
});

const createOne = asyncHandler(async (req, res) => {
  const { id_panti, judul, konten } = req.body;
  if (!id_panti || !judul || !konten) {
    return res.status(400).json({ message: 'Panti, judul, dan konten wajib diisi.' });
  }

  let fotoUrl = null;
  if (req.file) {
    const uploaded = await uploadBufferToStorage(req.file, 'cerita-aktivitas');
    fotoUrl = uploaded?.url || null;
  }

  const result = await pool.query(
    `INSERT INTO cerita_aktivitas (id_panti, judul, konten, foto_url)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [id_panti, judul, konten, fotoUrl]
  );

  await logCeritaAktivitas({
    id_cerita: result.rows[0].id,
    id_panti: Number(id_panti),
    judul,
    konten,
    foto_url: fotoUrl,
    aksi: 'create'
  });

  return sendSuccess(res, 'Cerita berhasil dibuat.', result.rows[0], 201);
});

const updateOne = asyncHandler(async (req, res) => {
  const { id_panti, judul, konten } = req.body;
  let fotoUrl = null;
  if (req.file) {
    const uploaded = await uploadBufferToStorage(req.file, 'cerita-aktivitas');
    fotoUrl = uploaded?.url || null;
  }

  const result = await pool.query(
    `UPDATE cerita_aktivitas
     SET id_panti = COALESCE($1, id_panti),
         judul = COALESCE($2, judul),
         konten = COALESCE($3, konten),
         foto_url = COALESCE($4, foto_url)
     WHERE id = $5
     RETURNING *`,
    [id_panti || null, judul || null, konten || null, fotoUrl, req.params.id]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ message: 'Cerita tidak ditemukan.' });
  }

  await logCeritaAktivitas({
    id_cerita: result.rows[0].id,
    id_panti: result.rows[0].id_panti,
    judul: result.rows[0].judul,
    konten: result.rows[0].konten,
    foto_url: result.rows[0].foto_url,
    aksi: 'update'
  });

  return sendSuccess(res, 'Cerita berhasil diperbarui.', result.rows[0]);
});

const removeOne = asyncHandler(async (req, res) => {
  const result = await pool.query('DELETE FROM cerita_aktivitas WHERE id = $1 RETURNING *', [req.params.id]);
  if (result.rowCount === 0) {
    return res.status(404).json({ message: 'Cerita tidak ditemukan.' });
  }

  await logCeritaAktivitas({
    id_cerita: result.rows[0].id,
    id_panti: result.rows[0].id_panti,
    judul: result.rows[0].judul,
    aksi: 'delete'
  });

  return sendSuccess(res, 'Cerita berhasil dihapus.', result.rows[0]);
});

module.exports = {
  getAll,
  getById,
  createOne,
  updateOne,
  removeOne
};
