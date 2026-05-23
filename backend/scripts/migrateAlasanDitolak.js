require('dotenv').config();
const pool = require('../src/config/db');

async function main() {
  console.log('Starting migration...');

  // 1. Add alasan_ditolak column if not exists
  await pool.query(`
    ALTER TABLE donasi
    ADD COLUMN IF NOT EXISTS alasan_ditolak TEXT
  `);
  console.log('Column alasan_ditolak verified/added successfully.');

  // 2. Drop old status check constraint if it exists
  await pool.query(`
    ALTER TABLE donasi DROP CONSTRAINT IF EXISTS donasi_status_check
  `);
  console.log('Old status check constraint dropped.');

  // 3. Add new status check constraint including refund_diajukan and refund_disetujui
  await pool.query(`
    ALTER TABLE donasi 
    ADD CONSTRAINT donasi_status_check 
    CHECK (status IN ('pending', 'verifikasi', 'ditolak', 'refund_diajukan', 'refund_disetujui'))
  `);
  console.log('New status check constraint added successfully.');
}

main()
  .then(() => {
    console.log('Migration completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error.message || error);
    process.exit(1);
  });
