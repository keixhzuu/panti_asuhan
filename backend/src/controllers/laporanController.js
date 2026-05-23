const fs = require('fs');
const os = require('os');
const path = require('path');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const pool = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { uploadBufferToStorage } = require('../utils/storage');



const downloadPdf = asyncHandler(async (req, res) => {
  const monthInput = req.query.periode_bulan || req.query.month;
  let year, month;
  if (monthInput) {
    const parts = monthInput.split('-');
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10) - 1;
  } else {
    const today = new Date();
    year = today.getFullYear();
    month = today.getMonth();
  }
  const pad = (n) => String(n).padStart(2, '0');
  const periodLabel = `${year}-${pad(month + 1)}-01`;

  // Format Indonesian month name
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const monthNamesLower = [
    'januari', 'februari', 'maret', 'april', 'mei', 'juni',
    'juli', 'agustus', 'september', 'oktober', 'november', 'desember'
  ];
  const formattedPeriod = `${monthNames[month]} ${year}`;
  const monthNameLower = monthNamesLower[month];
  const filename = `laporan-transparansi-${monthNameLower}.pdf`;

  const [masukResult, keluarResult, rincianMasuk, rincianKeluar] = await Promise.all([
    pool.query(
      `SELECT COALESCE(SUM(nominal), 0) AS total
       FROM donasi
       WHERE status = 'verifikasi'
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
      `SELECT 
          d.id,
          d.created_at,
          d.nominal,
          d.jumlah_donasi,
          d.metode_bayar,
          dn.nama AS nama_donatur,
          kl.nama_barang
       FROM donasi d
       JOIN donatur dn ON d.id_donatur = dn.id
       JOIN kebutuhan_logistik kl ON d.id_kebutuhan = kl.id
       WHERE d.status = 'verifikasi'
         AND DATE_TRUNC('month', d.created_at) = DATE_TRUNC('month', $1::date)
       ORDER BY d.created_at ASC`,
      [periodLabel]
    ),
    pool.query(
      `SELECT 
          pd.id,
          pd.tanggal_salur,
          pd.jumlah_disalurkan,
          pd.deskripsi_penggunaan,
          p.nama_panti,
          kl.nama_barang
       FROM penyaluran_dana pd
       JOIN panti p ON pd.id_panti = p.id
       JOIN donasi d ON pd.id_donasi = d.id
       JOIN kebutuhan_logistik kl ON d.id_kebutuhan = kl.id
       WHERE pd.status_penyaluran = 'berhasil'
         AND DATE_TRUNC('month', pd.tanggal_salur) = DATE_TRUNC('month', $1::date)
       ORDER BY pd.tanggal_salur ASC`,
      [periodLabel]
    )
  ]);

  const totalDanaMasuk = Number(masukResult.rows[0].total);
  const totalDanaKeluar = Number(keluarResult.rows[0].total);
  const saldoAkhir = totalDanaMasuk - totalDanaKeluar;

  const doc = new PDFDocument({ margin: 50, bufferPages: true });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  doc.pipe(res);

  // Helper for page checking
  const ensureSpace = (doc, heightNeeded) => {
    if (doc.y + heightNeeded > 700) {
      doc.addPage();
    }
  };

  const drawTableRow = (doc, columns, colWidths, alignRightLast = false, isHeader = false) => {
    const rowHeight = 22;
    ensureSpace(doc, rowHeight);

    const currentY = doc.y;
    let currentX = 50;

    if (isHeader) {
      const bgColor = isHeader === 'keluar' ? '#991B1B' : '#0F766E';
      doc.rect(50, currentY, 512, rowHeight).fill(bgColor);
      doc.fillColor('#FFFFFF');
    } else {
      doc.rect(50, currentY, 512, rowHeight).strokeColor('#E2E8F0').lineWidth(0.5).stroke();
      doc.fillColor('#334155');
    }

    doc.fontSize(8);
    columns.forEach((text, i) => {
      const w = colWidths[i];
      const isLast = i === columns.length - 1;
      const align = (isLast && alignRightLast) ? 'right' : 'left';

      const padding = 5;
      const textOptions = {
        width: w - padding * 2,
        height: rowHeight - padding * 2,
        align: align,
        ellipsis: true
      };

      if (isHeader) {
        doc.font('Helvetica-Bold');
      } else {
        doc.font(i === 0 ? 'Helvetica-Bold' : 'Helvetica');
      }

      doc.text(String(text), currentX + padding, currentY + 6, textOptions);
      currentX += w;
    });

    doc.y = currentY + rowHeight;
  };

  // Header Banner
  doc.rect(50, 40, 512, 60).fill('#0C1B33');
  doc.fillColor('#FFFFFF').fontSize(16).font('Helvetica-Bold').text('LAPORAN TRANSPARANSI KEUANGAN', 60, 52);
  doc.fontSize(10).font('Helvetica-Oblique').fillColor('#94A3B8').text(`Periode: ${formattedPeriod}`, 60, 75);
  doc.y = 115;

  // Draw 3 Summary Cards
  ensureSpace(doc, 70);
  const cardY = doc.y;

  // Card 1: Pemasukan
  doc.rect(50, cardY, 160, 55).fill('#F0FDF4');
  doc.rect(50, cardY, 160, 55).strokeColor('#DCFCE7').lineWidth(1).stroke();
  doc.fillColor('#15803D').fontSize(8).font('Helvetica-Bold').text('TOTAL PEMASUKAN', 60, cardY + 10);
  doc.fillColor('#166534').fontSize(11).font('Helvetica-Bold').text(`Rp ${totalDanaMasuk.toLocaleString('id-ID')}`, 60, cardY + 28);

  // Card 2: Pengeluaran
  doc.rect(226, cardY, 160, 55).fill('#FEF2F2');
  doc.rect(226, cardY, 160, 55).strokeColor('#FEE2E2').lineWidth(1).stroke();
  doc.fillColor('#B91C1C').fontSize(8).font('Helvetica-Bold').text('TOTAL PENGELUARAN', 236, cardY + 10);
  doc.fillColor('#991B1B').fontSize(11).font('Helvetica-Bold').text(`Rp ${totalDanaKeluar.toLocaleString('id-ID')}`, 236, cardY + 28);

  // Card 3: Saldo Akhir
  doc.rect(402, cardY, 160, 55).fill('#F8FAFC');
  doc.rect(402, cardY, 160, 55).strokeColor('#E2E8F0').lineWidth(1).stroke();
  doc.fillColor('#475569').fontSize(8).font('Helvetica-Bold').text('SALDO AKHIR', 412, cardY + 10);
  doc.fillColor('#0F172A').fontSize(11).font('Helvetica-Bold').text(`Rp ${saldoAkhir.toLocaleString('id-ID')}`, 412, cardY + 28);

  doc.y = cardY + 75;

  // Table 1: Pemasukan
  ensureSpace(doc, 40);
  doc.fillColor('#0C1B33').fontSize(12).font('Helvetica-Bold').text('A. Rincian Pemasukan (Donasi Masuk)', 50, doc.y);
  doc.moveDown(0.4);

  const colWidthsMasuk = [25, 75, 125, 125, 72, 90];
  drawTableRow(doc, ['No', 'Tanggal Donasi', 'Nama Donatur', 'Barang / Kebutuhan', 'Metode Bayar', 'Jumlah Masuk'], colWidthsMasuk, true, 'masuk');

  if (rincianMasuk.rows.length === 0) {
    drawTableRow(doc, ['-', '-', 'Tidak ada data pemasukan', '-', '-', 'Rp 0'], colWidthsMasuk, true);
  } else {
    rincianMasuk.rows.forEach((row, idx) => {
      const formattedDate = new Date(row.created_at).toLocaleDateString('id-ID');
      drawTableRow(doc, [
        idx + 1,
        formattedDate,
        row.nama_donatur,
        `${row.nama_barang} (${row.jumlah_donasi} unit)`,
        row.metode_bayar || '-',
        `Rp ${Number(row.nominal).toLocaleString('id-ID')}`
      ], colWidthsMasuk, true);
    });
  }

  // Total Pemasukan row
  ensureSpace(doc, 22);
  const totalMasukY = doc.y;
  doc.rect(50, totalMasukY, 512, 22).fill('#F3F4F6');
  doc.rect(50, totalMasukY, 512, 22).strokeColor('#E2E8F0').lineWidth(0.5).stroke();
  doc.fillColor('#1F2937').fontSize(9).font('Helvetica-Bold').text('TOTAL PEMASUKAN', 60, totalMasukY + 6);
  doc.text(`Rp ${totalDanaMasuk.toLocaleString('id-ID')}`, 400, totalMasukY + 6, { align: 'right', width: 152 });
  doc.y = totalMasukY + 35;

  // Table 2: Pengeluaran
  ensureSpace(doc, 40);
  doc.fillColor('#0C1B33').fontSize(12).font('Helvetica-Bold').text('B. Rincian Pengeluaran (Penyaluran Dana)', 50, doc.y);
  doc.moveDown(0.4);

  const colWidthsKeluar = [25, 75, 110, 110, 110, 82];
  drawTableRow(doc, ['No', 'Tanggal Salur', 'Penerima (Panti)', 'Barang / Kebutuhan', 'Keterangan Penggunaan', 'Jumlah Keluar'], colWidthsKeluar, true, 'keluar');

  if (rincianKeluar.rows.length === 0) {
    drawTableRow(doc, ['-', '-', 'Tidak ada data pengeluaran', '-', '-', 'Rp 0'], colWidthsKeluar, true);
  } else {
    rincianKeluar.rows.forEach((row, idx) => {
      const formattedDate = new Date(row.tanggal_salur).toLocaleDateString('id-ID');
      drawTableRow(doc, [
        idx + 1,
        formattedDate,
        row.nama_panti,
        row.nama_barang,
        row.deskripsi_penggunaan || '-',
        `Rp ${Number(row.jumlah_disalurkan).toLocaleString('id-ID')}`
      ], colWidthsKeluar, true);
    });
  }

  // Total Pengeluaran row
  ensureSpace(doc, 22);
  const totalKeluarY = doc.y;
  doc.rect(50, totalKeluarY, 512, 22).fill('#F3F4F6');
  doc.rect(50, totalKeluarY, 512, 22).strokeColor('#E2E8F0').lineWidth(0.5).stroke();
  doc.fillColor('#1F2937').fontSize(9).font('Helvetica-Bold').text('TOTAL PENGELUARAN', 60, totalKeluarY + 6);
  doc.text(`Rp ${totalDanaKeluar.toLocaleString('id-ID')}`, 400, totalKeluarY + 6, { align: 'right', width: 152 });
  doc.y = totalKeluarY + 22;

  // Add footers on all pages
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.fillColor('#94A3B8').fontSize(8).font('Helvetica');
    doc.text(
      `Halaman ${i + 1} dari ${range.count}  |  Dicetak secara otomatis oleh sistem pada ${new Date().toLocaleString('id-ID')}`,
      50,
      730,
      { align: 'center', width: 512 }
    );
  }

  doc.end();
});

const downloadExcel = asyncHandler(async (req, res) => {
  const monthInput = req.query.periode_bulan || req.query.month;
  let year, month;
  if (monthInput) {
    const parts = monthInput.split('-');
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10) - 1;
  } else {
    const today = new Date();
    year = today.getFullYear();
    month = today.getMonth();
  }
  const pad = (n) => String(n).padStart(2, '0');
  const periodLabel = `${year}-${pad(month + 1)}-01`;

  // Format Indonesian month name
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const monthNamesLower = [
    'januari', 'februari', 'maret', 'april', 'mei', 'juni',
    'juli', 'agustus', 'september', 'oktober', 'november', 'desember'
  ];
  const formattedPeriod = `${monthNames[month]} ${year}`;
  const monthNameLower = monthNamesLower[month];
  const filename = `laporan-transparansi-${monthNameLower}.xlsx`;

  const [masukResult, keluarResult, rincianMasuk, rincianKeluar] = await Promise.all([
    pool.query(
      `SELECT COALESCE(SUM(nominal), 0) AS total
       FROM donasi
       WHERE status = 'verifikasi'
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
      `SELECT 
          d.id,
          d.created_at,
          d.nominal,
          d.jumlah_donasi,
          d.metode_bayar,
          dn.nama AS nama_donatur,
          kl.nama_barang
       FROM donasi d
       JOIN donatur dn ON d.id_donatur = dn.id
       JOIN kebutuhan_logistik kl ON d.id_kebutuhan = kl.id
       WHERE d.status = 'verifikasi'
         AND DATE_TRUNC('month', d.created_at) = DATE_TRUNC('month', $1::date)
       ORDER BY d.created_at ASC`,
      [periodLabel]
    ),
    pool.query(
      `SELECT 
          pd.id,
          pd.tanggal_salur,
          pd.jumlah_disalurkan,
          pd.deskripsi_penggunaan,
          p.nama_panti,
          kl.nama_barang
       FROM penyaluran_dana pd
       JOIN panti p ON pd.id_panti = p.id
       JOIN donasi d ON pd.id_donasi = d.id
       JOIN kebutuhan_logistik kl ON d.id_kebutuhan = kl.id
       WHERE pd.status_penyaluran = 'berhasil'
         AND DATE_TRUNC('month', pd.tanggal_salur) = DATE_TRUNC('month', $1::date)
       ORDER BY pd.tanggal_salur ASC`,
      [periodLabel]
    )
  ]);

  const totalDanaMasuk = Number(masukResult.rows[0].total);
  const totalDanaKeluar = Number(keluarResult.rows[0].total);
  const saldoAkhir = totalDanaMasuk - totalDanaKeluar;

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Laporan Transparansi');

  // Set column widths
  sheet.columns = [
    { width: 5 },   // A: No
    { width: 15 },  // B: Tanggal
    { width: 25 },  // C: Donatur / Panti
    { width: 25 },  // D: Barang / Kebutuhan
    { width: 20 },  // E: Detail / Metode
    { width: 20 },  // F: Nominal
  ];

  // Title
  sheet.mergeCells('A1:F1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'LAPORAN TRANSPARANSI KEUANGAN DONASI';
  titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0C1B33' }
  };
  sheet.getRow(1).height = 40;

  // Period
  sheet.mergeCells('A2:F2');
  const periodCell = sheet.getCell('A2');
  periodCell.value = `Periode: ${formattedPeriod}`;
  periodCell.font = { name: 'Arial', size: 11, italic: true };
  periodCell.alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.getRow(2).height = 20;

  // Blank row
  sheet.addRow([]);

  // Summary Table
  sheet.addRow(['RINGKASAN KEUANGAN']).font = { bold: true, size: 12 };
  sheet.addRow(['Total Dana Masuk (Donasi Terverifikasi)', '', '', '', '', totalDanaMasuk]);
  sheet.addRow(['Total Dana Keluar (Penyaluran Berhasil)', '', '', '', '', totalDanaKeluar]);
  sheet.addRow(['Saldo Akhir Periode', '', '', '', '', saldoAkhir]).font = { bold: true };

  // Format summary numbers
  const numFmt = '[$Rp-3C09] #,##0;([$Rp-3C09] #,##0);"-"';
  sheet.getCell('F5').numFmt = numFmt;
  sheet.getCell('F6').numFmt = numFmt;
  sheet.getCell('F7').numFmt = numFmt;

  // Merge columns for summary
  sheet.mergeCells('A5:E5');
  sheet.mergeCells('A6:E6');
  sheet.mergeCells('A7:E7');

  // Borders for summary
  const thinBorder = {
    top: { style: 'thin' },
    bottom: { style: 'thin' },
    left: { style: 'thin' },
    right: { style: 'thin' }
  };
  ['A5', 'F5', 'A6', 'F6', 'A7', 'F7'].forEach(c => {
    sheet.getCell(c).border = thinBorder;
  });

  sheet.addRow([]);
  sheet.addRow([]);

  // Table 1: Pemasukan
  sheet.addRow(['RINCIAN PEMASUKAN (DONASI MASUK)']).font = { bold: true, size: 12, color: { argb: 'FF0F766E' } };

  const headerMasukRow = sheet.addRow(['No', 'Tanggal Donasi', 'Nama Donatur', 'Barang / Kebutuhan', 'Metode Bayar', 'Jumlah Masuk']);
  headerMasukRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerMasukRow.eachCell(cell => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F766E' }
    };
    cell.border = thinBorder;
    cell.alignment = { horizontal: 'center' };
  });

  if (rincianMasuk.rows.length === 0) {
    const dataRow = sheet.addRow(['-', '-', 'Tidak ada data pemasukan', '-', '-', 0]);
    dataRow.getCell(6).numFmt = numFmt;
    dataRow.eachCell(cell => {
      cell.border = thinBorder;
    });
  } else {
    rincianMasuk.rows.forEach((row, idx) => {
      const formattedDate = new Date(row.created_at).toLocaleDateString('id-ID');
      const dataRow = sheet.addRow([
        idx + 1,
        formattedDate,
        row.nama_donatur,
        `${row.nama_barang} (${row.jumlah_donasi} unit)`,
        row.metode_bayar || '-',
        Number(row.nominal)
      ]);
      dataRow.getCell(6).numFmt = numFmt;
      dataRow.eachCell(cell => {
        cell.border = thinBorder;
      });
    });
  }

  // Total Pemasukan Row
  const totalMasukRowIdx = sheet.rowCount + 1;
  sheet.addRow(['TOTAL PEMASUKAN', '', '', '', '', totalDanaMasuk]);
  sheet.mergeCells(`A${totalMasukRowIdx}:E${totalMasukRowIdx}`);
  const tmLabel = sheet.getCell(`A${totalMasukRowIdx}`);
  tmLabel.font = { bold: true };
  tmLabel.alignment = { horizontal: 'right' };
  const tmVal = sheet.getCell(`F${totalMasukRowIdx}`);
  tmVal.font = { bold: true };
  tmVal.numFmt = numFmt;
  [`A${totalMasukRowIdx}`, `F${totalMasukRowIdx}`].forEach(c => {
    sheet.getCell(c).border = thinBorder;
    sheet.getCell(c).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF3F4F6' }
    };
  });

  sheet.addRow([]);
  sheet.addRow([]);

  // Table 2: Pengeluaran
  sheet.addRow(['RINCIAN PENGELUARAN (PENYALURAN DANA)']).font = { bold: true, size: 12, color: { argb: 'FF991B1B' } };

  const headerKeluarRow = sheet.addRow(['No', 'Tanggal Salur', 'Penerima (Panti)', 'Barang / Kebutuhan', 'Keterangan Penggunaan', 'Jumlah Keluar']);
  headerKeluarRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerKeluarRow.eachCell(cell => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF991B1B' }
    };
    cell.border = thinBorder;
    cell.alignment = { horizontal: 'center' };
  });

  if (rincianKeluar.rows.length === 0) {
    const dataRow = sheet.addRow(['-', '-', 'Tidak ada data pengeluaran', '-', '-', 0]);
    dataRow.getCell(6).numFmt = numFmt;
    dataRow.eachCell(cell => {
      cell.border = thinBorder;
    });
  } else {
    rincianKeluar.rows.forEach((row, idx) => {
      const formattedDate = new Date(row.tanggal_salur).toLocaleDateString('id-ID');
      const dataRow = sheet.addRow([
        idx + 1,
        formattedDate,
        row.nama_panti,
        row.nama_barang,
        row.deskripsi_penggunaan || '-',
        Number(row.jumlah_disalurkan)
      ]);
      dataRow.getCell(6).numFmt = numFmt;
      dataRow.eachCell(cell => {
        cell.border = thinBorder;
      });
    });
  }

  // Total Pengeluaran Row
  const totalKeluarRowIdx = sheet.rowCount + 1;
  sheet.addRow(['TOTAL PENGELUARAN', '', '', '', '', totalDanaKeluar]);
  sheet.mergeCells(`A${totalKeluarRowIdx}:E${totalKeluarRowIdx}`);
  const tkLabel = sheet.getCell(`A${totalKeluarRowIdx}`);
  tkLabel.font = { bold: true };
  tkLabel.alignment = { horizontal: 'right' };
  const tkVal = sheet.getCell(`F${totalKeluarRowIdx}`);
  tkVal.font = { bold: true };
  tkVal.numFmt = numFmt;
  [`A${totalKeluarRowIdx}`, `F${totalKeluarRowIdx}`].forEach(c => {
    sheet.getCell(c).border = thinBorder;
    sheet.getCell(c).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF3F4F6' }
    };
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  await workbook.xlsx.write(res);
  res.end();
});

const getKategoriData = asyncHandler(async (req, res) => {
  const result = await pool.query(`
    SELECT
      COALESCE(p.nama_panti, 'Tidak Diketahui') AS kategori,
      COALESCE(SUM(pd.jumlah_disalurkan), 0)::float AS total
    FROM penyaluran_dana pd
    JOIN panti p ON p.id = pd.id_panti
    WHERE pd.status_penyaluran = 'berhasil'
    GROUP BY p.nama_panti
    ORDER BY total DESC
    LIMIT 10
  `);

  return sendSuccess(res, 'Data kategori penyaluran berhasil dimuat.', result.rows);
});

const getTrendData = asyncHandler(async (req, res) => {
  const result = await pool.query(`
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
  `);

  return sendSuccess(res, 'Data tren transaksi berhasil dimuat.', result.rows);
});

module.exports = {
  downloadPdf,
  downloadExcel,
  getTrendData,
  getKategoriData
};
