const fs = require('fs');
const os = require('os');
const path = require('path');
const PDFDocument = require('pdfkit');
const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { uploadBufferToStorage } = require('../utils/storage');

function createPdfBuffer(payload) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(20).text('Laporan Transparansi Donasi', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Periode: ${payload.periode_bulan}`);
    doc.text(`Total dana masuk: Rp ${Number(payload.total_dana_masuk).toLocaleString('id-ID')}`);
    doc.text(`Total dana keluar: Rp ${Number(payload.total_dana_keluar).toLocaleString('id-ID')}`);
    doc.text(`Saldo akhir: Rp ${Number(payload.saldo_akhir).toLocaleString('id-ID')}`);
    doc.moveDown();
    doc.text('Dokumen ini digenerate otomatis oleh sistem donasi panti asuhan.');
    doc.end();
  });
}

const getAll = asyncHandler(async (req, res) => {
  const result = await pool.query('SELECT * FROM laporan_transparansi ORDER BY created_at DESC');
  return sendSuccess(res, 'Daftar laporan berhasil dimuat.', result.rows);
});

const generateOne = asyncHandler(async (req, res) => {
  const monthInput = req.body.periode_bulan || req.body.month;
  const dateValue = monthInput ? new Date(monthInput) : new Date();
  const periodStart = new Date(dateValue.getFullYear(), dateValue.getMonth(), 1);
  const periodLabel = periodStart.toISOString().slice(0, 10);

  const [masukResult, keluarResult, penyaluranResult] = await Promise.all([
    pool.query(
      `SELECT COALESCE(SUM(nominal), 0) AS total
       FROM donasi
       WHERE status IN ('terverifikasi', 'diterima')
       AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', $1::date)`,
      [periodLabel]
    ),
    pool.query(
      `SELECT COALESCE(SUM(jumlah_disalurkan), 0) AS total
       FROM penyaluran_dana
       WHERE status_penyaluran = 'berhasil'
       AND DATE_TRUNC('month', tanggal_salur) = DATE_TRUNC('month', $1::date)`,
      [periodLabel]
    ),
    pool.query(
      `SELECT id
       FROM penyaluran_dana
       WHERE DATE_TRUNC('month', tanggal_salur) = DATE_TRUNC('month', $1::date)
       ORDER BY created_at DESC
       LIMIT 1`,
      [periodLabel]
    )
  ]);

  if (penyaluranResult.rowCount === 0) {
    return res.status(400).json({ message: 'Belum ada data penyaluran untuk periode ini.' });
  }

  const totalDanaMasuk = Number(masukResult.rows[0].total);
  const totalDanaKeluar = Number(keluarResult.rows[0].total);
  const saldoAkhir = totalDanaMasuk - totalDanaKeluar;

  const pdfBuffer = await createPdfBuffer({
    periode_bulan: periodLabel,
    total_dana_masuk: totalDanaMasuk,
    total_dana_keluar: totalDanaKeluar,
    saldo_akhir: saldoAkhir
  });

  const uploaded = await uploadBufferToStorage(
    {
      buffer: pdfBuffer,
      originalname: `laporan-${periodLabel}.pdf`,
      mimetype: 'application/pdf'
    },
    'laporan-transparansi'
  );

  const insertResult = await pool.query(
    `INSERT INTO laporan_transparansi
      (id_penyaluran, total_dana_masuk, total_dana_keluar, saldo_akhir, periode_bulan, file_laporan_url)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [penyaluranResult.rows[0].id, totalDanaMasuk, totalDanaKeluar, saldoAkhir, periodLabel, uploaded?.url || null]
  );

  return sendSuccess(res, 'Laporan transparansi berhasil dibuat.', {
    report: insertResult.rows[0],
    file_url: uploaded?.url || null
  }, 201);
});

module.exports = {
  getAll,
  generateOne
};
