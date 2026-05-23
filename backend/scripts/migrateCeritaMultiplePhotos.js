// Migration: add foto_urls to cerita_aktivitas for multi-photo story posts
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      ALTER TABLE cerita_aktivitas
        ADD COLUMN IF NOT EXISTS foto_urls JSONB DEFAULT '[]'::jsonb;
    `);
    console.log('✅ Added foto_urls to cerita_aktivitas');

    await client.query(`
      UPDATE cerita_aktivitas
      SET foto_urls = CASE
        WHEN foto_urls IS NOT NULL AND jsonb_typeof(foto_urls) = 'array' THEN foto_urls
        WHEN foto_url IS NOT NULL THEN jsonb_build_array(foto_url)
        ELSE '[]'::jsonb
      END
      WHERE foto_urls IS NULL;
    `);
    console.log('✅ Backfilled foto_urls from foto_url');

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
