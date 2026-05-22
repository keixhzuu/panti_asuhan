require('dotenv').config();

const pool = require('../src/config/db');

async function main() {
  const result = await pool.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'penyaluran_dana'
      AND column_name = 'bukti_url'
  `);

  if (result.rowCount > 0) {
    console.log('Kolom penyaluran_dana.bukti_url sudah ada.');
    process.exit(0);
  }

  await pool.query('ALTER TABLE penyaluran_dana ADD COLUMN bukti_url TEXT');
  console.log('Kolom penyaluran_dana.bukti_url berhasil ditambahkan.');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Gagal menambahkan kolom bukti_url:', error.message || error);
    process.exit(1);
  });