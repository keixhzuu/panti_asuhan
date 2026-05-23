// Migration: add foto_profil_url to donatur, add foto_panti_url & deskripsi to panti
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      ALTER TABLE donatur
        ADD COLUMN IF NOT EXISTS foto_profil_url TEXT;
    `);
    console.log('✅ Added foto_profil_url to donatur');

    await client.query(`
      ALTER TABLE panti
        ADD COLUMN IF NOT EXISTS foto_panti_url TEXT,
        ADD COLUMN IF NOT EXISTS deskripsi TEXT;
    `);
    console.log('✅ Added foto_panti_url and deskripsi to panti');

    await client.query('COMMIT');
    console.log('✅ Migration complete.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
