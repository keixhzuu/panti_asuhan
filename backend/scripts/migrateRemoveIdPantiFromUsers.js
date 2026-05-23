const { Pool } = require('pg');
require('dotenv').config();

async function run() {
  console.log('Connecting to DATABASE_URL...');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    console.log('Dropping column id_panti from users table...');
    await client.query('ALTER TABLE users DROP COLUMN IF EXISTS id_panti CASCADE;');
    console.log('✅ Column id_panti dropped successfully.');
  } catch (err) {
    console.error('❌ Error dropping column:', err.message || err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
