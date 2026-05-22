const { Pool } = require('pg');
const env = require('../src/config/env');

async function run() {
  const pool = new Pool({ connectionString: env.databaseUrl });

  try {
    await pool.query(`
      ALTER TABLE donasi
      ADD COLUMN IF NOT EXISTS jumlah_donasi INT NOT NULL DEFAULT 1
    `);

    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'donasi_jumlah_donasi_positive'
        ) THEN
          ALTER TABLE donasi
          ADD CONSTRAINT donasi_jumlah_donasi_positive CHECK (jumlah_donasi > 0);
        END IF;
      END$$;
    `);

    console.log('Kolom jumlah_donasi pada donasi berhasil dipastikan ada.');
  } catch (error) {
    console.error('Migrasi jumlah_donasi gagal:', error.message || error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();
