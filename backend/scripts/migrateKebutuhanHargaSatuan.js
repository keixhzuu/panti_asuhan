const { Pool } = require('pg');
const env = require('../src/config/env');

async function run() {
  const pool = new Pool({ connectionString: env.databaseUrl });

  try {
    await pool.query(`
      ALTER TABLE kebutuhan_logistik
      ADD COLUMN IF NOT EXISTS harga_satuan DECIMAL(15,2) NOT NULL DEFAULT 0
    `);

    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'kebutuhan_harga_satuan_nonnegative'
        ) THEN
          ALTER TABLE kebutuhan_logistik
          ADD CONSTRAINT kebutuhan_harga_satuan_nonnegative CHECK (harga_satuan >= 0);
        END IF;
      END$$;
    `);

    console.log('Kolom harga_satuan pada kebutuhan_logistik berhasil dipastikan ada.');
  } catch (error) {
    console.error('Migrasi kebutuhan harga_satuan gagal:', error.message || error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

run();
