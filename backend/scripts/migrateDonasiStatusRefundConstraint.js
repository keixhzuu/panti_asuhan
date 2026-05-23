require('dotenv').config();
const pool = require('../src/config/db');

async function main() {
  await pool.query(`ALTER TABLE donasi DROP CONSTRAINT IF EXISTS donasi_status_check`);

  await pool.query(`
    ALTER TABLE donasi
    ADD CONSTRAINT donasi_status_check
    CHECK (status IN ('pending', 'verifikasi', 'ditolak', 'refund_diajukan', 'refund_disetujui'))
  `);

  console.log('✅ donasi_status_check updated to include refund statuses.');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Failed to update donasi_status_check:', error.message || error);
    process.exit(1);
  });
