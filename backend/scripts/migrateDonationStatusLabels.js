require('dotenv').config();

const pool = require('../src/config/db');

async function main() {
  await pool.query(`ALTER TABLE donasi DROP CONSTRAINT IF EXISTS donasi_status_check`);

  await pool.query(`
    UPDATE donasi
    SET status = CASE
      WHEN status IN ('terverifikasi', 'diterima') THEN 'verifikasi'
      WHEN status = 'pending' THEN 'pending'
      ELSE status
    END
    WHERE status IN ('terverifikasi', 'diterima')
  `);

  await pool.query(`ALTER TABLE donasi ADD CONSTRAINT donasi_status_check CHECK (status IN ('pending', 'verifikasi', 'ditolak'))`);

  console.log('Status donasi berhasil dimigrasikan ke pending/verifikasi/ditolak.');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migrasi status donasi gagal:', error.message || error);
    process.exit(1);
  });
