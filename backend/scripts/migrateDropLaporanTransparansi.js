const { Pool } = require('pg');
require('dotenv').config();

async function run() {
  console.log('Connecting to DATABASE_URL...');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    console.log('Dropping table laporan_transparansi CASCADE if exists...');
    await client.query('DROP TABLE IF EXISTS laporan_transparansi CASCADE;');
    console.log('✅ Table laporan_transparansi dropped successfully.');
  } catch (err) {
    console.error('❌ Error dropping table:', err.message || err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
