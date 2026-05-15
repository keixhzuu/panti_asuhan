const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { uploadBufferToStorage } = require('../utils/storage');
const { logBuktiFoto, logTransparansiTimeline } = require('../utils/firestore');

const createOne = asyncHandler(async (req, res) => {
  const { id_donasi, id_panti, jumlah_disalurkan, tanggal_salur, deskripsi_penggunaan, status_penyaluran } = req.body;

  if (!id_donasi || !id_panti || !jumlah_disalurkan || !tanggal_salur) {
    return res.status(400).json({ message: 'Donasi, panti, jumlah, dan tanggal salur wajib diisi.' });
  }

  const result = await pool.query(
    `INSERT INTO penyaluran_dana (id_donasi, id_panti, jumlah_disalurkan, tanggal_salur, deskripsi_penggunaan, status_penyaluran)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [id_donasi, id_panti, jumlah_disalurkan, tanggal_salur, deskripsi_penggunaan || null, status_penyaluran || 'berhasil']
  );

  const penyaluran = result.rows[0];
  let buktiUrl = null;

  if (req.file) {
    const uploaded = await uploadBufferToStorage(req.file, 'bukti-penyaluran');
    buktiUrl = uploaded?.url || null;

    await logBuktiFoto({
      id_penyaluran: penyaluran.id,
      id_panti: Number(id_panti),
      url: buktiUrl,
      deskripsi: deskripsi_penggunaan || 'Bukti penyaluran dana',
      tipe: 'penyaluran_dana'
    });
  }

  await logTransparansiTimeline({
    id_penyaluran: penyaluran.id,
    id_donasi: Number(id_donasi),
    id_panti: Number(id_panti),
    jumlah_disalurkan: Number(jumlah_disalurkan),
    tanggal_salur,
    deskripsi_penggunaan: deskripsi_penggunaan || null,
    bukti_url: buktiUrl,
    tipe: 'penyaluran_dana'
  });

  return sendSuccess(res, 'Penyaluran dana berhasil dibuat.', {
    ...penyaluran,
    bukti_url: buktiUrl
  }, 201);
});

const attachBukti = asyncHandler(async (req, res) => {
  const { id_penyaluran, deskripsi } = req.body;
  if (!id_penyaluran) {
    return res.status(400).json({ message: 'ID penyaluran wajib diisi.' });
  }
  if (!req.file) {
    return res.status(400).json({ message: 'File bukti wajib diunggah.' });
  }

  const penyaluranResult = await pool.query('SELECT * FROM penyaluran_dana WHERE id = $1', [id_penyaluran]);
  if (penyaluranResult.rowCount === 0) {
    return res.status(404).json({ message: 'Data penyaluran tidak ditemukan.' });
  }

  const uploaded = await uploadBufferToStorage(req.file, 'bukti-penyaluran');

  await logBuktiFoto({
    id_penyaluran: Number(id_penyaluran),
    id_panti: penyaluranResult.rows[0].id_panti,
    url: uploaded.url,
    deskripsi: deskripsi || 'Bukti tambahan penyaluran dana',
    tipe: 'penyaluran_dana'
  });

  await logTransparansiTimeline({
    id_penyaluran: Number(id_penyaluran),
    id_donasi: penyaluranResult.rows[0].id_donasi,
    id_panti: penyaluranResult.rows[0].id_panti,
    jumlah_disalurkan: Number(penyaluranResult.rows[0].jumlah_disalurkan),
    tanggal_salur: penyaluranResult.rows[0].tanggal_salur,
    deskripsi_penggunaan: deskripsi || penyaluranResult.rows[0].deskripsi_penggunaan,
    bukti_url: uploaded.url,
    tipe: 'bukti_penyaluran'
  });

  return sendSuccess(res, 'Bukti penyaluran berhasil diunggah.', {
    id_penyaluran: Number(id_penyaluran),
    url: uploaded.url,
    deskripsi: deskripsi || null
  }, 201);
});

module.exports = {
  createOne,
  attachBukti
};
